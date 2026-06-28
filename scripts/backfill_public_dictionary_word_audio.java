import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.net.URI;
import java.net.URLEncoder;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class backfill_public_dictionary_word_audio {
    private static final String JDBC_URL = "jdbc:mysql://sh-cynosdbmysql-grp-ft100p3o.sql.tencentcdb.com:29616/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=60000";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "pzq915981048.";
    private static final String API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    private static final String WIKTIONARY_API = "https://en.wiktionary.org/w/api.php?action=parse&prop=wikitext&format=json&page=";
    private static final String COMMONS_API = "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url%7Cextmetadata&format=json&titles=";
    private static final String LOG_PATH = "logs/public-dictionary-word-audio-backfill.log";
    private static final String REPORT_PATH = "logs/public-dictionary-word-audio-backfill.tsv";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public static void main(String[] args) throws Exception {
        Config config = Config.parse(args);
        Files.createDirectories(Path.of("logs"));
        Class.forName("com.mysql.cj.jdbc.Driver");

        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
             PrintWriter log = new PrintWriter(new FileWriter(LOG_PATH, true), true);
             PrintWriter report = new PrintWriter(new FileWriter(REPORT_PATH, true), true)) {
            Stats before = loadStats(conn);
            log(log, "START limit=" + config.limit + ", delayMs=" + config.delayMs
                    + ", dryRun=" + config.dryRun + ", overwrite=" + config.overwrite
                    + ", before=" + before);
            System.out.println("BEFORE " + before);

            List<WordRow> rows = loadRows(conn, config);
            System.out.println("QUEUED " + rows.size());
            if (config.dryRun) {
                for (int i = 0; i < Math.min(20, rows.size()); i++) {
                    WordRow row = rows.get(i);
                    System.out.println(row.id + "\tbook=" + row.bookId + "\t" + row.word
                            + "\tus=" + blank(row.audioUsUrl) + "\tuk=" + blank(row.audioUkUrl));
                }
                return;
            }

            int processed = 0;
            int updated = 0;
            int partial = 0;
            int missing = 0;
            int failed = 0;

            for (WordRow row : rows) {
                processed++;
                try {
                    AudioMatch match = fetchAudio(row.word);
                    if (match.usUrl == null && match.ukUrl == null) {
                        match = fetchWiktionaryAudio(row.word);
                        if (match.rateLimited) {
                            missing++;
                            writeReport(report, "RATE_LIMITED", row, match, "wiktionary api rate limited");
                            log(log, "RATE_LIMITED wordId=" + row.id + " word=" + row.word);
                            Thread.sleep(Math.max(config.delayMs, 10_000));
                            continue;
                        }
                    }

                    if (match.usUrl == null && match.ukUrl == null) {
                        missing++;
                        writeReport(report, "MISS", row, match, "no public audio");
                        log(log, "MISS wordId=" + row.id + " word=" + row.word);
                    } else {
                        UpdateResult result = updateWord(conn, row, match, config.overwrite);
                        if (result.changed) {
                            updated++;
                            if (result.partial) {
                                partial++;
                            }
                            writeReport(report, result.partial ? "PARTIAL" : "OK", row, match, "");
                            log(log, (result.partial ? "PARTIAL" : "OK") + " wordId=" + row.id
                                    + " word=" + row.word + " us=" + blank(match.usUrl) + " uk=" + blank(match.ukUrl));
                        } else {
                            writeReport(report, "UNCHANGED", row, match, "existing urls kept");
                            log(log, "UNCHANGED wordId=" + row.id + " word=" + row.word);
                        }
                    }
                } catch (Exception e) {
                    failed++;
                    String error = truncate(e.getMessage() == null ? e.toString() : e.getMessage(), 500);
                    writeReport(report, "FAILED", row, new AudioMatch(), error);
                    log(log, "FAILED wordId=" + row.id + " word=" + row.word + " error=" + error);
                }

                if (processed % 100 == 0) {
                    System.out.println("PROGRESS processed=" + processed + ", updated=" + updated
                            + ", partial=" + partial + ", missing=" + missing + ", failed=" + failed);
                }
                Thread.sleep(config.delayMs);
            }

            Stats after = loadStats(conn);
            log(log, "COMPLETED processed=" + processed + ", updated=" + updated
                    + ", partial=" + partial + ", missing=" + missing + ", failed=" + failed + ", after=" + after);
            System.out.println("COMPLETED processed=" + processed + ", updated=" + updated
                    + ", partial=" + partial + ", missing=" + missing + ", failed=" + failed);
            System.out.println("AFTER " + after);
        }
    }

    private static List<WordRow> loadRows(Connection conn, Config config) throws Exception {
        String whereMissing = config.overwrite
                ? ""
                : "and (w.audio_us_url is null or w.audio_us_url = '' or w.audio_uk_url is null or w.audio_uk_url = '') ";
        String sql = "select w.id, w.word_book_id, w.word, w.audio_us_url, w.audio_uk_url "
                + "from words w join word_books b on b.id = w.word_book_id "
                + "where w.deleted = false and b.deleted = false "
                + "and w.word is not null and w.word <> '' "
                + whereMissing
                + "order by w.word_book_id asc, w.sort_order asc, w.id asc limit ?";
        List<WordRow> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, config.limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    WordRow row = new WordRow();
                    row.id = rs.getLong("id");
                    row.bookId = rs.getLong("word_book_id");
                    row.word = rs.getString("word");
                    row.audioUsUrl = rs.getString("audio_us_url");
                    row.audioUkUrl = rs.getString("audio_uk_url");
                    rows.add(row);
                }
            }
        }
        return rows;
    }

    private static Stats loadStats(Connection conn) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement(
                "select count(*) total, "
                        + "sum(case when audio_us_url is not null and audio_us_url <> '' then 1 else 0 end) us_done, "
                        + "sum(case when audio_uk_url is not null and audio_uk_url <> '' then 1 else 0 end) uk_done, "
                        + "sum(case when (audio_us_url is null or audio_us_url = '' or audio_uk_url is null or audio_uk_url = '') then 1 else 0 end) missing_either "
                        + "from words w join word_books b on b.id = w.word_book_id where w.deleted = false and b.deleted = false");
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            Stats stats = new Stats();
            stats.total = rs.getInt("total");
            stats.usDone = rs.getInt("us_done");
            stats.ukDone = rs.getInt("uk_done");
            stats.missingEither = rs.getInt("missing_either");
            return stats;
        }
    }

    private static AudioMatch fetchAudio(String word) throws Exception {
        String encoded = URLEncoder.encode(word.trim().toLowerCase(Locale.ROOT), StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + encoded))
                .header("User-Agent", "xiaoyouyingyu-public-dictionary-audio-backfill/1.0")
                .timeout(Duration.ofSeconds(20))
                .GET()
                .build();
        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() == 404) {
            return new AudioMatch();
        }
        if (response.statusCode() == 429) {
            AudioMatch match = new AudioMatch();
            match.rateLimited = true;
            return match;
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("dictionary api failed (" + response.statusCode() + "): " + truncate(response.body(), 300));
        }

        JsonNode root = MAPPER.readTree(response.body());
        AudioMatch match = new AudioMatch();
        if (!root.isArray()) {
            return match;
        }
        for (JsonNode entry : root) {
            JsonNode phonetics = entry.path("phonetics");
            if (!phonetics.isArray()) {
                continue;
            }
            for (JsonNode phonetic : phonetics) {
                String audio = text(phonetic.path("audio"));
                if (audio == null) {
                    continue;
                }
                String lower = audio.toLowerCase(Locale.ROOT);
                String sourceUrl = text(phonetic.path("sourceUrl"));
                String licenseName = text(phonetic.path("license").path("name"));
                String licenseUrl = text(phonetic.path("license").path("url"));
                if (match.usUrl == null && (lower.contains("-us.") || lower.contains("_us.") || lower.contains(" us "))) {
                    match.usUrl = audio;
                    match.usSourceUrl = sourceUrl;
                    match.usLicense = licenseName;
                    match.usLicenseUrl = licenseUrl;
                } else if (match.ukUrl == null && (lower.contains("-uk.") || lower.contains("_uk.") || lower.contains("-gb.") || lower.contains("_gb.") || lower.contains("uk.mp3"))) {
                    match.ukUrl = audio;
                    match.ukSourceUrl = sourceUrl;
                    match.ukLicense = licenseName;
                    match.ukLicenseUrl = licenseUrl;
                }
                if (match.usUrl != null && match.ukUrl != null) {
                    return match;
                }
            }
        }
        return match;
    }

    private static AudioMatch fetchWiktionaryAudio(String word) throws Exception {
        String encoded = URLEncoder.encode(word.trim().toLowerCase(Locale.ROOT), StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(WIKTIONARY_API + encoded))
                .header("User-Agent", "xiaoyouyingyu-public-dictionary-audio-backfill/1.0")
                .timeout(Duration.ofSeconds(20))
                .GET()
                .build();
        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() == 404) {
            return new AudioMatch();
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("wiktionary api failed (" + response.statusCode() + "): " + truncate(response.body(), 300));
        }
        JsonNode root = MAPPER.readTree(response.body());
        String wikitext = text(root.path("parse").path("wikitext").path("*"));
        if (wikitext == null) {
            return new AudioMatch();
        }

        AudioMatch match = new AudioMatch();
        for (String template : findAudioTemplates(wikitext)) {
            String lower = template.toLowerCase(Locale.ROOT);
            String fileName = audioFileName(template);
            if (fileName == null) {
                continue;
            }
            boolean us = lower.contains("a=us") || lower.contains("a=ga") || fileName.toLowerCase(Locale.ROOT).contains("en-us-");
            boolean uk = lower.contains("a=uk") || lower.contains("a=rp") || lower.contains("a=gb") || fileName.toLowerCase(Locale.ROOT).contains("en-uk-");
            if (!us && !uk) {
                continue;
            }
            CommonsFile file = fetchCommonsFile(fileName);
            if (file.url == null) {
                continue;
            }
            if (us && match.usUrl == null) {
                match.usUrl = file.url;
                match.usSourceUrl = file.sourceUrl;
                match.usLicense = file.license;
                match.usLicenseUrl = file.licenseUrl;
            } else if (uk && match.ukUrl == null) {
                match.ukUrl = file.url;
                match.ukSourceUrl = file.sourceUrl;
                match.ukLicense = file.license;
                match.ukLicenseUrl = file.licenseUrl;
            }
            if (match.usUrl != null && match.ukUrl != null) {
                return match;
            }
        }
        return match;
    }

    private static List<String> findAudioTemplates(String wikitext) {
        List<String> templates = new ArrayList<>();
        String marker = "{{audio|en|";
        int index = 0;
        while ((index = wikitext.indexOf(marker, index)) >= 0) {
            int end = wikitext.indexOf("}}", index);
            if (end < 0) {
                break;
            }
            templates.add(wikitext.substring(index, end + 2));
            index = end + 2;
        }
        return templates;
    }

    private static String audioFileName(String template) {
        String[] parts = template.substring(2, template.length() - 2).split("\\|");
        if (parts.length < 3) {
            return null;
        }
        String fileName = parts[2].trim();
        return fileName.isBlank() ? null : fileName;
    }

    private static CommonsFile fetchCommonsFile(String fileName) throws Exception {
        String title = fileName.startsWith("File:") ? fileName : "File:" + fileName;
        String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(COMMONS_API + encodedTitle))
                .header("User-Agent", "xiaoyouyingyu-public-dictionary-audio-backfill/1.0")
                .timeout(Duration.ofSeconds(20))
                .GET()
                .build();
        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("commons api failed (" + response.statusCode() + "): " + truncate(response.body(), 300));
        }
        JsonNode pages = MAPPER.readTree(response.body()).path("query").path("pages");
        if (!pages.isObject()) {
            return new CommonsFile();
        }
        for (JsonNode page : pages) {
            JsonNode imageInfo = page.path("imageinfo");
            if (!imageInfo.isArray() || imageInfo.size() == 0) {
                continue;
            }
            JsonNode info = imageInfo.get(0);
            CommonsFile file = new CommonsFile();
            file.url = text(info.path("url"));
            file.sourceUrl = text(info.path("descriptionurl"));
            JsonNode meta = info.path("extmetadata");
            file.license = text(meta.path("LicenseShortName").path("value"));
            file.licenseUrl = text(meta.path("LicenseUrl").path("value"));
            return file;
        }
        return new CommonsFile();
    }

    private static UpdateResult updateWord(Connection conn, WordRow row, AudioMatch match, boolean overwrite) throws Exception {
        String nextUs = overwrite || isBlank(row.audioUsUrl) ? match.usUrl : row.audioUsUrl;
        String nextUk = overwrite || isBlank(row.audioUkUrl) ? match.ukUrl : row.audioUkUrl;
        boolean changed = !same(row.audioUsUrl, nextUs) || !same(row.audioUkUrl, nextUk);
        if (!changed) {
            return new UpdateResult(false, false);
        }
        boolean hasUs = !isBlank(nextUs);
        boolean hasUk = !isBlank(nextUk);
        String status = hasUs && hasUk ? "READY" : null;
        String error = hasUs && hasUk ? null : "PUBLIC_DICTIONARY_AUDIO_PARTIAL";

        try (PreparedStatement ps = conn.prepareStatement(
                "update words set audio_us_url = ?, audio_uk_url = ?, "
                        + "audio_status = case when ? is null then audio_status else ? end, "
                        + "audio_error = ?, updated_at = now() where id = ?")) {
            ps.setString(1, nextUs);
            ps.setString(2, nextUk);
            ps.setString(3, status);
            ps.setString(4, status);
            ps.setString(5, error);
            ps.setLong(6, row.id);
            ps.executeUpdate();
        }
        return new UpdateResult(true, !(hasUs && hasUk));
    }

    private static void writeReport(PrintWriter report, String status, WordRow row, AudioMatch match, String message) {
        report.println(status + "\t" + row.id + "\t" + row.bookId + "\t" + row.word + "\t"
                + blank(match.usUrl) + "\t" + blank(match.usSourceUrl) + "\t" + blank(match.usLicense) + "\t" + blank(match.usLicenseUrl) + "\t"
                + blank(match.ukUrl) + "\t" + blank(match.ukSourceUrl) + "\t" + blank(match.ukLicense) + "\t" + blank(match.ukLicenseUrl) + "\t"
                + message.replace('\t', ' '));
    }

    private static void log(PrintWriter log, String message) {
        log.println(java.time.LocalDateTime.now() + " " + message);
    }

    private static String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static boolean same(String left, String right) {
        return blank(left).equals(blank(right));
    }

    private static String blank(String value) {
        return value == null ? "" : value;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() > max ? value.substring(0, max) : value;
    }

    private record UpdateResult(boolean changed, boolean partial) {
    }

    private static class Config {
        int limit = 6000;
        int delayMs = 250;
        boolean dryRun = false;
        boolean overwrite = false;

        static Config parse(String[] args) {
            Config config = new Config();
            for (String arg : args) {
                if (arg.equals("--dry-run")) {
                    config.dryRun = true;
                } else if (arg.equals("--overwrite")) {
                    config.overwrite = true;
                } else if (arg.startsWith("--limit=")) {
                    config.limit = Integer.parseInt(arg.substring("--limit=".length()));
                } else if (arg.startsWith("--delay-ms=")) {
                    config.delayMs = Integer.parseInt(arg.substring("--delay-ms=".length()));
                }
            }
            return config;
        }
    }

    private static class WordRow {
        long id;
        long bookId;
        String word;
        String audioUsUrl;
        String audioUkUrl;
    }

    private static class AudioMatch {
        String usUrl;
        String usSourceUrl;
        String usLicense;
        String usLicenseUrl;
        String ukUrl;
        String ukSourceUrl;
        String ukLicense;
        String ukLicenseUrl;
        boolean rateLimited;
    }

    private static class CommonsFile {
        String url;
        String sourceUrl;
        String license;
        String licenseUrl;
    }

    private static class Stats {
        int total;
        int usDone;
        int ukDone;
        int missingEither;

        @Override
        public String toString() {
            return "total=" + total + ", usDone=" + usDone + ", ukDone=" + ukDone + ", missingEither=" + missingEither;
        }
    }
}
