import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class backfill_all_wordbook_audio {
    private static final String JDBC_URL = "jdbc:mysql://sh-cynosdbmysql-grp-ft100p3o.sql.tencentcdb.com:29616/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=60000";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "pzq915981048.";
    private static final String UPLOAD_DIR = "uploads";
    private static final String LOG_PATH = "logs/wordbook-audio-backfill-all.log";
    private static final String PROGRESS_PATH = "logs/wordbook-audio-backfill-all.progress.json";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private static final int MAX_TTS_ATTEMPTS = 5;

    public static void main(String[] args) throws Exception {
        int workers = args.length > 0 ? Integer.parseInt(args[0]) : 24;
        int wordsPerMinute = args.length > 1 ? Integer.parseInt(args[1]) : 200;
        int maxWords = args.length > 2 ? Integer.parseInt(args[2]) : 0;
        if (workers <= 0) {
            throw new IllegalArgumentException("workers must be > 0");
        }
        if (wordsPerMinute <= 0) {
            throw new IllegalArgumentException("wordsPerMinute must be > 0");
        }

        Files.createDirectories(Path.of("logs"));
        Class.forName("com.mysql.cj.jdbc.Driver");
        BackfillStats stats = new BackfillStats();
        try (PrintWriter log = new PrintWriter(new FileWriter(LOG_PATH, true), true);
             Connection conn = openConnection()) {
            TtsModel model = loadDefaultTtsModel(conn);
            int staleRunning = resetStaleRunning(conn);
            List<WordBookRow> books = loadBooks(conn);
            stats.total = countPending(conn);
            stats.queued = maxWords > 0 ? Math.min(maxWords, stats.total) : stats.total;
            writeProgress(conn, books, stats, "RUNNING", null);
            log(log, "START workers=" + workers + ", wordsPerMinute=" + wordsPerMinute
                    + ", maxWords=" + maxWords + ", queued=" + stats.queued
                    + ", staleRunningReset=" + staleRunning
                    + ", ttsModel=" + model.modelName + ", provider=" + model.provider);

            ExecutorService executor = Executors.newFixedThreadPool(workers);
            long delayMs = Math.max(1L, 60_000L / wordsPerMinute);
            AtomicInteger submitted = new AtomicInteger();

            while (maxWords <= 0 || submitted.get() < maxWords) {
                WordRow word = claimNextWord();
                if (word == null) {
                    break;
                }
                int current = submitted.incrementAndGet();
                executor.submit(() -> processWord(model, word, stats));
                if (current % 50 == 0) {
                    writeProgressFresh(books, stats, "RUNNING", null);
                }
                Thread.sleep(delayMs);
            }

            executor.shutdown();
            while (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
                writeProgressFresh(books, stats, "RUNNING", null);
                log(log, "PROGRESS processed=" + stats.processed.get()
                        + ", succeeded=" + stats.succeeded.get()
                        + ", failed=" + stats.failed.get());
            }

            writeProgressFresh(books, stats, "COMPLETED", null);
            log(log, "COMPLETED processed=" + stats.processed.get()
                    + ", succeeded=" + stats.succeeded.get()
                    + ", failed=" + stats.failed.get());
        } catch (Exception e) {
            try (Connection conn = openConnection()) {
                writeProgress(conn, List.of(), stats, "FAILED", e.getMessage());
            } catch (Exception ignored) {
            }
            throw e;
        }
    }

    private static void processWord(TtsModel model, WordRow word, BackfillStats stats) {
        try (PrintWriter log = new PrintWriter(new FileWriter(LOG_PATH, true), true);
             Connection conn = openConnection()) {
            try {
                AudioUrls urls = generateAll(model, word);
                updateReady(conn, word.id, urls, phoneticFor(word.word));
                stats.succeeded.incrementAndGet();
                log(log, "OK bookId=" + word.bookId + " wordId=" + word.id + " word=" + word.word);
            } catch (Exception e) {
                stats.failed.incrementAndGet();
                String error = truncate(e.getMessage() == null ? e.toString() : e.getMessage(), 900);
                updateFailed(conn, word.id, error);
                log(log, "FAILED bookId=" + word.bookId + " wordId=" + word.id + " word=" + word.word + " error=" + error);
            } finally {
                stats.processed.incrementAndGet();
            }
        } catch (Exception ignored) {
            stats.processed.incrementAndGet();
            stats.failed.incrementAndGet();
        }
    }

    private static Connection openConnection() throws Exception {
        Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
        conn.setAutoCommit(true);
        return conn;
    }

    private static TtsModel loadDefaultTtsModel(Connection conn) throws Exception {
        String sql = "select id, name, base_url, api_key, model_name, provider, voice_us, voice_uk, output_format "
                + "from tts_models where enabled = true order by is_default desc, created_at desc limit 1";
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            if (!rs.next()) {
                throw new IllegalStateException("No enabled TTS model configured");
            }
            TtsModel model = new TtsModel();
            model.id = rs.getLong("id");
            model.name = rs.getString("name");
            model.baseUrl = rs.getString("base_url");
            model.apiKey = rs.getString("api_key");
            model.modelName = rs.getString("model_name");
            model.provider = rs.getString("provider");
            model.voiceUs = rs.getString("voice_us");
            model.voiceUk = rs.getString("voice_uk");
            model.outputFormat = rs.getString("output_format");
            return model;
        }
    }

    private static List<WordBookRow> loadBooks(Connection conn) throws Exception {
        List<WordBookRow> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "select id, name from word_books where deleted = false order by id asc");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                WordBookRow row = new WordBookRow();
                row.id = rs.getLong("id");
                row.name = rs.getString("name");
                rows.add(row);
            }
        }
        return rows;
    }

    private static int countPending(Connection conn) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement(
                "select count(*) from words w join word_books b on b.id = w.word_book_id "
                        + "where w.deleted = false and b.deleted = false "
                        + "and (audio_status <> 'READY' or audio_status is null "
                        + "or audio_us_url is null or audio_uk_url is null "
                        + "or example_audio_us_url is null or example_audio_uk_url is null)");
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private static int resetStaleRunning(Connection conn) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement(
                "update words w join word_books b on b.id = w.word_book_id "
                        + "set w.audio_error = null, w.updated_at = now() "
                        + "where w.deleted = false and b.deleted = false and w.audio_status = 'PENDING' and w.audio_error = 'RUNNING'")) {
            return ps.executeUpdate();
        }
    }

    private static WordRow claimNextWord() throws Exception {
        try (Connection conn = openConnection()) {
            WordRow word = null;
            try (PreparedStatement ps = conn.prepareStatement(
                    "select w.id, w.word_book_id, w.word, w.example_en from words w "
                            + "join word_books b on b.id = w.word_book_id "
                            + "where w.deleted = false and b.deleted = false "
                            + "and (audio_status <> 'READY' or audio_status is null "
                            + "or audio_us_url is null or audio_uk_url is null "
                            + "or example_audio_us_url is null or example_audio_uk_url is null) "
                            + "and (audio_error is null or audio_error <> 'RUNNING') "
                            + "order by w.word_book_id asc, w.sort_order asc, w.id asc limit 1");
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    word = new WordRow();
                    word.id = rs.getLong("id");
                    word.bookId = rs.getLong("word_book_id");
                    word.word = rs.getString("word");
                    word.exampleEn = rs.getString("example_en");
                }
            }
            if (word == null) {
                return null;
            }
            try (PreparedStatement ps = conn.prepareStatement(
                    "update words w join word_books b on b.id = w.word_book_id "
                            + "set w.audio_status = 'PENDING', w.audio_error = 'RUNNING', w.updated_at = now() "
                            + "where w.id = ? and w.deleted = false and b.deleted = false "
                            + "and (w.audio_status <> 'READY' or w.audio_status is null "
                            + "or w.audio_us_url is null or w.audio_uk_url is null "
                            + "or w.example_audio_us_url is null or w.example_audio_uk_url is null) "
                            + "and (w.audio_error is null or w.audio_error <> 'RUNNING')")) {
                ps.setLong(1, word.id);
                if (ps.executeUpdate() == 1) {
                    return word;
                }
            }
        }
        return claimNextWord();
    }

    private static AudioUrls generateAll(TtsModel model, WordRow word) throws Exception {
        String format = resolveStoredFormat(model);
        Path dir = Path.of(UPLOAD_DIR, "word-audio", String.valueOf(word.bookId), String.valueOf(word.id));
        Files.createDirectories(dir);
        AudioUrls urls = new AudioUrls();
        urls.wordUs = generateOne(model, word.word, model.voiceUs, dir.resolve("word-us." + format));
        urls.wordUk = generateOne(model, word.word, model.voiceUk, dir.resolve("word-uk." + format));
        urls.exampleUs = generateOne(model, word.exampleEn, model.voiceUs, dir.resolve("example-us." + format));
        urls.exampleUk = generateOne(model, word.exampleEn, model.voiceUk, dir.resolve("example-uk." + format));
        return urls;
    }

    private static String generateOne(TtsModel model, String text, String voice, Path target) throws Exception {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Audio text is blank");
        }
        if (isQwenProvider(model)) {
            return generateQwen(model, text, voice, target);
        }
        return generateOpenAiCompatible(model, text, voice, target);
    }

    private static String generateOpenAiCompatible(TtsModel model, String text, String voice, Path target) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model.modelName);
        body.put("voice", voice);
        body.put("input", text);
        body.put("response_format", normalizeFormat(model.outputFormat));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeSpeechUrl(model.baseUrl)))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + model.apiKey)
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .build();
        HttpResponse<byte[]> response = null;
        for (int attempt = 1; attempt <= MAX_TTS_ATTEMPTS; attempt++) {
            response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 429) {
                break;
            }
            Thread.sleep(backoffMs(attempt));
        }
        if (response == null || response.statusCode() < 200 || response.statusCode() >= 300) {
            int status = response == null ? 0 : response.statusCode();
            String error = response == null ? "" : new String(response.body(), StandardCharsets.UTF_8);
            throw new IllegalStateException("TTS failed (" + status + "): " + truncate(error, 900));
        }
        Files.write(target, response.body());
        return localUrl(target);
    }

    private static String generateQwen(TtsModel model, String text, String voice, Path target) throws Exception {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("text", text);
        input.put("voice", voice);
        input.put("language_type", "English");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model.modelName);
        body.put("input", input);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeQwenGenerationUrl(model.baseUrl)))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + model.apiKey)
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .build();
        HttpResponse<byte[]> response = null;
        for (int attempt = 1; attempt <= MAX_TTS_ATTEMPTS; attempt++) {
            response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 429) {
                break;
            }
            Thread.sleep(backoffMs(attempt));
        }
        if (response == null || response.statusCode() < 200 || response.statusCode() >= 300) {
            int status = response == null ? 0 : response.statusCode();
            String error = response == null ? "" : new String(response.body(), StandardCharsets.UTF_8);
            throw new IllegalStateException("Qwen TTS failed (" + status + "): " + truncate(error, 900));
        }
        JsonNode root = MAPPER.readTree(response.body());
        String audioUrl = root.path("output").path("audio").path("url").asText();
        if (audioUrl == null || audioUrl.trim().isEmpty()) {
            throw new IllegalStateException("Qwen TTS returned no audio URL: " + truncate(root.toString(), 900));
        }
        HttpRequest downloadRequest = HttpRequest.newBuilder()
                .uri(URI.create(audioUrl))
                .timeout(Duration.ofSeconds(120))
                .GET()
                .build();
        HttpResponse<byte[]> downloadResponse = HTTP_CLIENT.send(downloadRequest, HttpResponse.BodyHandlers.ofByteArray());
        if (downloadResponse.statusCode() < 200 || downloadResponse.statusCode() >= 300) {
            throw new IllegalStateException("Qwen audio download failed (" + downloadResponse.statusCode() + ")");
        }
        Files.write(target, downloadResponse.body());
        return localUrl(target);
    }

    private static void updateReady(Connection conn, long wordId, AudioUrls urls, String phonetic) throws Exception {
        String sql = "update words set audio_us_url = ?, audio_uk_url = ?, example_audio_us_url = ?, "
                + "example_audio_uk_url = ?, audio_status = 'READY', audio_error = null, "
                + "phonetic = coalesce(nullif(phonetic, ''), ?), updated_at = now() where id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, urls.wordUs);
            ps.setString(2, urls.wordUk);
            ps.setString(3, urls.exampleUs);
            ps.setString(4, urls.exampleUk);
            ps.setString(5, phonetic);
            ps.setLong(6, wordId);
            ps.executeUpdate();
        }
    }

    private static void updateFailed(Connection conn, long wordId, String error) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement(
                "update words set audio_status = 'FAILED', audio_error = ?, updated_at = now() where id = ?")) {
            ps.setString(1, error);
            ps.setLong(2, wordId);
            ps.executeUpdate();
        }
    }

    private static void writeProgress(Connection conn, List<WordBookRow> books, BackfillStats stats, String status, String error) throws Exception {
        Map<String, Object> progress = new LinkedHashMap<>();
        progress.put("updatedAt", LocalDateTime.now().toString());
        progress.put("status", status);
        progress.put("totalPendingAtStart", stats.total);
        progress.put("queuedThisRun", stats.queued);
        progress.put("processedThisRun", stats.processed.get());
        progress.put("succeededThisRun", stats.succeeded.get());
        progress.put("failedThisRun", stats.failed.get());
        progress.put("remainingPending", countPending(conn));
        progress.put("error", error);
        progress.put("books", bookStats(conn, books));
        MAPPER.writerWithDefaultPrettyPrinter().writeValue(new File(PROGRESS_PATH), progress);
    }

    private static void writeProgressFresh(List<WordBookRow> books, BackfillStats stats, String status, String error) throws Exception {
        try (Connection conn = openConnection()) {
            writeProgress(conn, books, stats, status, error);
        }
    }

    private static List<Map<String, Object>> bookStats(Connection conn, List<WordBookRow> books) throws Exception {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (WordBookRow book : books) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", book.id);
            item.put("name", book.name);
            try (PreparedStatement ps = conn.prepareStatement(
                    "select count(*) total, "
                            + "sum(case when audio_status = 'READY' then 1 else 0 end) ready, "
                            + "sum(case when audio_status = 'FAILED' then 1 else 0 end) failed "
                            + "from words where word_book_id = ? and deleted = false")) {
                ps.setLong(1, book.id);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    item.put("total", rs.getInt("total"));
                    item.put("ready", rs.getInt("ready"));
                    item.put("failed", rs.getInt("failed"));
                }
            }
            rows.add(item);
        }
        return rows;
    }

    private static String phoneticFor(String text) {
        return null;
    }

    private static String normalizeSpeechUrl(String baseUrl) {
        String trimmed = baseUrl.trim();
        if (trimmed.endsWith("/audio/speech")) return trimmed;
        if (trimmed.endsWith("/")) trimmed = trimmed.substring(0, trimmed.length() - 1);
        return trimmed + "/audio/speech";
    }

    private static String normalizeQwenGenerationUrl(String baseUrl) {
        String trimmed = baseUrl.trim();
        if (trimmed.endsWith("/services/aigc/multimodal-generation/generation")) return trimmed;
        if (trimmed.endsWith("/")) trimmed = trimmed.substring(0, trimmed.length() - 1);
        return trimmed + "/services/aigc/multimodal-generation/generation";
    }

    private static boolean isQwenProvider(TtsModel model) {
        String provider = model.provider == null ? "" : model.provider.trim().toLowerCase();
        return provider.equals("qwen") || provider.equals("dashscope") || provider.equals("aliyun");
    }

    private static String resolveStoredFormat(TtsModel model) {
        if (isQwenProvider(model)) {
            String format = normalizeFormat(model.outputFormat);
            return "mp3".equals(format) ? "wav" : format;
        }
        return normalizeFormat(model.outputFormat);
    }

    private static String normalizeFormat(String format) {
        if (format == null || format.trim().isEmpty()) return "mp3";
        return format.trim().toLowerCase();
    }

    private static String localUrl(Path target) {
        Path wordDir = target.getParent();
        Path bookDir = wordDir.getParent();
        return "/uploads/word-audio/" + bookDir.getFileName() + "/" + wordDir.getFileName() + "/" + target.getFileName();
    }

    private static String truncate(String value, int max) {
        if (value == null) return "";
        return value.length() > max ? value.substring(0, max) : value;
    }

    private static long backoffMs(int attempt) {
        return Math.min(60_000L, 2_000L * (1L << Math.max(0, attempt - 1)));
    }

    private static void log(PrintWriter log, String message) {
        log.println(LocalDateTime.now() + " " + message);
    }

    private static class BackfillStats {
        int total;
        int queued;
        AtomicInteger processed = new AtomicInteger();
        AtomicInteger succeeded = new AtomicInteger();
        AtomicInteger failed = new AtomicInteger();
    }

    private static class TtsModel {
        long id;
        String name;
        String baseUrl;
        String apiKey;
        String modelName;
        String provider;
        String voiceUs;
        String voiceUk;
        String outputFormat;
    }

    private static class WordBookRow {
        long id;
        String name;
    }

    private static class WordRow {
        long id;
        long bookId;
        String word;
        String exampleEn;
    }

    private static class AudioUrls {
        String wordUs;
        String wordUk;
        String exampleUs;
        String exampleUk;
    }
}
