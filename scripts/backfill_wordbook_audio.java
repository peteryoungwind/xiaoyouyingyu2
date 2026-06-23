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

public class backfill_wordbook_audio {
    private static final String JDBC_URL = "jdbc:mysql://sh-cynosdbmysql-grp-ft100p3o.sql.tencentcdb.com:29616/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=60000";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "pzq915981048.";
    private static final String UPLOAD_DIR = "uploads";
    private static final String LOG_PATH = "logs/wordbook5-audio-backfill.log";
    private static final String PROGRESS_PATH = "logs/wordbook5-audio-backfill.progress.json";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public static void main(String[] args) throws Exception {
        long bookId = args.length > 0 ? Long.parseLong(args[0]) : 5L;
        int limit = args.length > 1 ? Integer.parseInt(args[1]) : 0;
        long sleepMs = args.length > 2 ? Long.parseLong(args[2]) : 2000L;
        Files.createDirectories(Path.of("logs"));
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (PrintWriter log = new PrintWriter(new FileWriter(LOG_PATH, true), true)) {
            log(log, "START bookId=" + bookId + ", limit=" + limit + ", sleepMs=" + sleepMs);
            try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
                conn.setAutoCommit(true);
                TtsModel model = loadDefaultTtsModel(conn);
                log(log, "TTS model id=" + model.id + ", provider=" + model.provider + ", model=" + model.modelName);
                List<WordRow> words = loadPendingWords(conn, bookId, limit);
                int total = countAll(conn, bookId);
                int readyAtStart = countStatus(conn, bookId, "READY");
                int processed = 0;
                int succeeded = 0;
                int failed = 0;
                writeProgress(bookId, total, readyAtStart, words.size(), processed, succeeded, failed, "RUNNING", null);

                for (WordRow word : words) {
                    processed++;
                    try {
                        AudioUrls urls = generateAll(model, word);
                        updateReady(conn, word.id, urls, phoneticFor(word.word));
                        succeeded++;
                        log(log, "OK wordId=" + word.id + " word=" + word.word);
                    } catch (Exception e) {
                        failed++;
                        String error = truncate(e.getMessage() == null ? e.toString() : e.getMessage(), 900);
                        updateFailed(conn, word.id, error);
                        log(log, "FAILED wordId=" + word.id + " word=" + word.word + " error=" + error);
                    }
                    int readyNow = countStatus(conn, bookId, "READY");
                    writeProgress(bookId, total, readyNow, words.size(), processed, succeeded, failed, "RUNNING", null);
                    Thread.sleep(sleepMs);
                }

                int readyAtEnd = countStatus(conn, bookId, "READY");
                int failedAtEnd = countStatus(conn, bookId, "FAILED");
                writeProgress(bookId, total, readyAtEnd, words.size(), processed, succeeded, failedAtEnd, "COMPLETED", null);
                log(log, "COMPLETED processed=" + processed + ", succeeded=" + succeeded + ", failed=" + failed
                        + ", readyTotal=" + readyAtEnd + ", failedTotal=" + failedAtEnd);
            } catch (Exception e) {
                writeProgress(bookId, 0, 0, 0, 0, 0, 0, "FAILED", e.getMessage());
                log(log, "FATAL " + e);
                throw e;
            }
        }
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

    private static List<WordRow> loadPendingWords(Connection conn, long bookId, int limit) throws Exception {
        String sql = "select id, word_book_id, word, example_en from words "
                + "where word_book_id = ? and deleted = false "
                + "and (audio_status <> 'READY' or audio_status is null "
                + "or audio_us_url is null or audio_uk_url is null "
                + "or example_audio_us_url is null or example_audio_uk_url is null) "
                + "order by sort_order asc, id asc";
        if (limit > 0) {
            sql += " limit " + limit;
        }
        List<WordRow> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, bookId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    WordRow row = new WordRow();
                    row.id = rs.getLong("id");
                    row.bookId = rs.getLong("word_book_id");
                    row.word = rs.getString("word");
                    row.exampleEn = rs.getString("example_en");
                    rows.add(row);
                }
            }
        }
        return rows;
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
        HttpResponse<byte[]> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("TTS failed (" + response.statusCode() + "): "
                    + truncate(new String(response.body(), StandardCharsets.UTF_8), 900));
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
        HttpResponse<byte[]> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Qwen TTS failed (" + response.statusCode() + "): "
                    + truncate(new String(response.body(), StandardCharsets.UTF_8), 900));
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

    private static int countAll(Connection conn, long bookId) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement("select count(*) from words where word_book_id = ? and deleted = false")) {
            ps.setLong(1, bookId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private static int countStatus(Connection conn, long bookId, String status) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement("select count(*) from words where word_book_id = ? and deleted = false and audio_status = ?")) {
            ps.setLong(1, bookId);
            ps.setString(2, status);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private static void writeProgress(long bookId, int total, int readyTotal, int queued, int processed, int succeeded, int failed, String status, String error) throws Exception {
        Map<String, Object> progress = new LinkedHashMap<>();
        progress.put("updatedAt", LocalDateTime.now().toString());
        progress.put("bookId", bookId);
        progress.put("status", status);
        progress.put("total", total);
        progress.put("readyTotal", readyTotal);
        progress.put("queuedThisRun", queued);
        progress.put("processedThisRun", processed);
        progress.put("succeededThisRun", succeeded);
        progress.put("failedThisRun", failed);
        progress.put("error", error);
        MAPPER.writerWithDefaultPrettyPrinter().writeValue(new File(PROGRESS_PATH), progress);
    }

    private static String phoneticFor(String text) {
        // Conservative placeholder: do not fake IPA for generated multi-word speaking phrases.
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

    private static void log(PrintWriter log, String message) {
        log.println(LocalDateTime.now() + " " + message);
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
