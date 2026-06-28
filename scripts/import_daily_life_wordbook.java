import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class import_daily_life_wordbook {
    private static final String JSON_PATH = "doc/generated/daily-life-wordbook.json";
    private static final String JDBC_URL = "jdbc:mysql://sh-cynosdbmysql-grp-ft100p3o.sql.tencentcdb.com:29616/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=60000";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "pzq915981048.";

    public static void main(String[] args) throws Exception {
        if (args.length >= 2 && "verify".equals(args[0])) {
            verify(Long.parseLong(args[1]));
            return;
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(new File(JSON_PATH));
        JsonNode book = root.get("wordBook");
        JsonNode words = root.get("words");
        if (book == null || words == null || !words.isArray()) {
            throw new IllegalArgumentException("Invalid wordbook JSON: missing wordBook or words");
        }
        if (words.size() != 1000) {
            throw new IllegalArgumentException("Expected 1000 words, got " + words.size());
        }

        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
            conn.setAutoCommit(false);
            try {
                String bookName = uniqueBookName(conn, text(book, "name"));
                long bookId = insertWordBook(conn, bookName, text(book, "description"), text(book, "scene"),
                        text(book, "level"), text(book, "status"));
                int inserted = insertWords(conn, bookId, words);
                Verification verification = verifyCounts(conn, bookId);
                if (inserted != 1000 || verification.total != 1000 || verification.beginner != 1000
                        || verification.advanced != 0 || verification.published != 1000 || verification.pendingAudio != 1000
                        || verification.definitionLabelHits != 0) {
                    throw new IllegalStateException("Import verification failed: inserted=" + inserted
                            + ", total=" + verification.total
                            + ", beginner=" + verification.beginner
                            + ", advanced=" + verification.advanced
                            + ", published=" + verification.published
                            + ", pendingAudio=" + verification.pendingAudio
                            + ", definitionLabelHits=" + verification.definitionLabelHits);
                }
                conn.commit();
                System.out.println("IMPORT_OK");
                System.out.println("wordBookId=" + bookId);
                System.out.println("wordBookName=" + ascii(bookName));
                System.out.println("inserted=" + inserted);
                System.out.println("beginner=" + verification.beginner);
                System.out.println("advanced=" + verification.advanced);
                System.out.println("published=" + verification.published);
                System.out.println("pendingAudio=" + verification.pendingAudio);
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }
    }

    private static void verify(long bookId) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "select id, name, level, status, scene from word_books where id = ?")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("word book not found: " + bookId);
                    }
                    System.out.println("book.id=" + rs.getLong("id"));
                    System.out.println("book.name=" + ascii(rs.getString("name")));
                    System.out.println("book.level=" + rs.getString("level"));
                    System.out.println("book.status=" + rs.getString("status"));
                    System.out.println("book.scene=" + ascii(rs.getString("scene")));
                }
            }
            Verification verification = verifyCounts(conn, bookId);
            System.out.println("words.total=" + verification.total);
            System.out.println("words.beginner=" + verification.beginner);
            System.out.println("words.advanced=" + verification.advanced);
            System.out.println("words.published=" + verification.published);
            System.out.println("words.pendingAudio=" + verification.pendingAudio);
            System.out.println("words.definitionLabelHits=" + verification.definitionLabelHits);
            try (PreparedStatement ps = conn.prepareStatement(
                    "select word, definition_zh, example_zh from words where word_book_id = ? order by sort_order asc limit 5")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        System.out.println(rs.getString("word") + "=" + ascii(rs.getString("definition_zh")));
                    }
                }
            }
        }
    }

    private static Verification verifyCounts(Connection conn, long bookId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "select count(*) total, "
                        + "sum(case when difficulty='BEGINNER' then 1 else 0 end) beginner, "
                        + "sum(case when difficulty='ADVANCED' then 1 else 0 end) advanced, "
                        + "sum(case when status='PUBLISHED' then 1 else 0 end) published, "
                        + "sum(case when audio_status='PENDING' then 1 else 0 end) pending_audio, "
                        + "sum(case when definition_zh like '%初级日常生活%' or definition_zh like '%日常生活%' or definition_zh like '%初级%' then 1 else 0 end) definition_label_hits "
                        + "from words where word_book_id = ? and deleted = false")) {
            ps.setLong(1, bookId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return new Verification(
                        rs.getLong("total"),
                        rs.getLong("beginner"),
                        rs.getLong("advanced"),
                        rs.getLong("published"),
                        rs.getLong("pending_audio"),
                        rs.getLong("definition_label_hits")
                );
            }
        }
    }

    private static String uniqueBookName(Connection conn, String baseName) throws SQLException {
        String sql = "select count(*) from word_books where name = ? and deleted = false";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, baseName);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                if (rs.getLong(1) == 0) {
                    return baseName;
                }
            }
        }
        return baseName + " " + LocalDateTime.now().toString().replace('T', ' ').substring(0, 16);
    }

    private static long insertWordBook(Connection conn, String name, String description, String scene,
                                       String level, String status) throws SQLException {
        String sql = "insert into word_books "
                + "(name, description, scene, level, status, deleted, created_by, created_at, updated_at) "
                + "values (?, ?, ?, ?, ?, false, null, now(), now())";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);
            ps.setString(2, description);
            ps.setString(3, scene);
            ps.setString(4, isBlank(level) ? "BEGINNER" : level);
            ps.setString(5, isBlank(status) ? "PUBLISHED" : status);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (!keys.next()) {
                    throw new SQLException("No generated key for word_books");
                }
                return keys.getLong(1);
            }
        }
    }

    private static int insertWords(Connection conn, long bookId, JsonNode words) throws SQLException {
        String sql = "insert into words ("
                + "word_book_id, word, normalized_word, difficulty, status, phonetic, part_of_speech, "
                + "definition_zh, definition_en, common_patterns, example_en, example_zh, "
                + "source_scene, source_topic_id, source_topic_title, "
                + "audio_us_url, audio_uk_url, example_audio_us_url, example_audio_uk_url, "
                + "audio_status, audio_error, sort_order, deleted, created_at, updated_at"
                + ") values ("
                + "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, null, null, null, "
                + "'PENDING', null, ?, false, ?, ?"
                + ")";
        List<String> normalizedSeen = new ArrayList<>();
        int inserted = 0;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (JsonNode word : words) {
                String value = text(word, "word");
                String normalized = normalize(value);
                if (isBlank(normalized) || normalizedSeen.contains(normalized) || !normalized.matches("[a-z]+")) {
                    throw new IllegalArgumentException("Duplicate, blank, or non-single word in JSON: " + value);
                }
                normalizedSeen.add(normalized);
                Timestamp now = Timestamp.valueOf(LocalDateTime.now());
                ps.setLong(1, bookId);
                ps.setString(2, value);
                ps.setString(3, normalized);
                ps.setString(4, text(word, "difficulty"));
                ps.setString(5, text(word, "status"));
                ps.setString(6, blankToNull(text(word, "phonetic")));
                ps.setString(7, text(word, "partOfSpeech"));
                ps.setString(8, text(word, "definitionZh"));
                ps.setString(9, text(word, "definitionEn"));
                ps.setString(10, text(word, "commonPatterns"));
                ps.setString(11, text(word, "exampleEn"));
                ps.setString(12, text(word, "exampleZh"));
                ps.setString(13, text(word, "sourceScene"));
                if (word.get("sourceTopicId") == null || word.get("sourceTopicId").isNull()) {
                    ps.setNull(14, java.sql.Types.BIGINT);
                } else {
                    ps.setLong(14, word.get("sourceTopicId").asLong());
                }
                ps.setString(15, text(word, "sourceTopicTitle"));
                ps.setInt(16, word.get("sortOrder").asInt());
                ps.setTimestamp(17, now);
                ps.setTimestamp(18, now);
                ps.addBatch();
            }
            int[] results = ps.executeBatch();
            for (int result : results) {
                if (result >= 0) inserted += result;
                else if (result == Statement.SUCCESS_NO_INFO) inserted++;
            }
        }
        return inserted;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static String blankToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String ascii(String value) {
        if (value == null) return "null";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (ch >= 32 && ch <= 126) builder.append(ch);
            else builder.append(String.format("\\u%04x", (int) ch));
        }
        return builder.toString();
    }

    private static class Verification {
        final long total;
        final long beginner;
        final long advanced;
        final long published;
        final long pendingAudio;
        final long definitionLabelHits;

        Verification(long total, long beginner, long advanced, long published, long pendingAudio, long definitionLabelHits) {
            this.total = total;
            this.beginner = beginner;
            this.advanced = advanced;
            this.published = published;
            this.pendingAudio = pendingAudio;
            this.definitionLabelHits = definitionLabelHits;
        }
    }
}
