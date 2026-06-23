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

public class import_business_english_wordbook {
    private static final String JSON_PATH = "doc/generated/business-english-wordbook.json";
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
        if (words.size() != 400) {
            throw new IllegalArgumentException("Expected 400 words, got " + words.size());
        }

        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
            conn.setAutoCommit(false);
            try {
                String bookName = uniqueBookName(conn, text(book, "name"));
                long bookId = insertWordBook(conn, bookName, text(book, "description"), text(book, "scene"), text(book, "status"));
                int inserted = insertWords(conn, bookId, words);
                long total = countWords(conn, bookId, null);
                long beginner = countWords(conn, bookId, "BEGINNER");
                long advanced = countWords(conn, bookId, "ADVANCED");
                if (inserted != 400 || total != 400 || beginner != 200 || advanced != 200) {
                    throw new IllegalStateException("Import verification failed: inserted=" + inserted
                            + ", total=" + total + ", beginner=" + beginner + ", advanced=" + advanced);
                }
                conn.commit();
                System.out.println("IMPORT_OK");
                System.out.println("wordBookId=" + bookId);
                System.out.println("wordBookName=" + bookName);
                System.out.println("inserted=" + inserted);
                System.out.println("beginner=" + beginner);
                System.out.println("advanced=" + advanced);
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
                    "select id, name, status, scene from word_books where id = ?")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("word book not found: " + bookId);
                    }
                    System.out.println("book.id=" + rs.getLong("id"));
                    System.out.println("book.name=" + ascii(rs.getString("name")));
                    System.out.println("book.status=" + rs.getString("status"));
                    System.out.println("book.scene=" + ascii(rs.getString("scene")));
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(
                    "select count(*) total, "
                            + "sum(case when difficulty='BEGINNER' then 1 else 0 end) beginner, "
                            + "sum(case when difficulty='ADVANCED' then 1 else 0 end) advanced "
                            + "from words where word_book_id = ? and deleted = false")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    System.out.println("words.total=" + rs.getLong("total"));
                    System.out.println("words.beginner=" + rs.getLong("beginner"));
                    System.out.println("words.advanced=" + rs.getLong("advanced"));
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(
                    "select word, definition_zh, example_zh from words where word_book_id = ? order by sort_order asc limit 1")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        System.out.println("first.word=" + rs.getString("word"));
                        System.out.println("first.definitionZh=" + ascii(rs.getString("definition_zh")));
                        System.out.println("first.exampleZh=" + ascii(rs.getString("example_zh")));
                    }
                }
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

    private static long insertWordBook(Connection conn, String name, String description, String scene, String status) throws SQLException {
        String sql = "insert into word_books "
                + "(name, description, scene, status, deleted, created_by, created_at, updated_at) "
                + "values (?, ?, ?, ?, false, null, now(), now())";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);
            ps.setString(2, description);
            ps.setString(3, scene);
            ps.setString(4, isBlank(status) ? "DRAFT" : status);
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
                if (isBlank(normalized) || normalizedSeen.contains(normalized)) {
                    throw new IllegalArgumentException("Duplicate or blank word in JSON: " + value);
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
                if (result >= 0) {
                    inserted += result;
                } else if (result == Statement.SUCCESS_NO_INFO) {
                    inserted++;
                }
            }
        }
        return inserted;
    }

    private static long countWords(Connection conn, long bookId, String difficulty) throws SQLException {
        String sql = difficulty == null
                ? "select count(*) from words where word_book_id = ? and deleted = false"
                : "select count(*) from words where word_book_id = ? and difficulty = ? and deleted = false";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, bookId);
            if (difficulty != null) {
                ps.setString(2, difficulty);
            }
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
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
        if (value == null) {
            return "null";
        }
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (ch >= 32 && ch <= 126) {
                builder.append(ch);
            } else {
                builder.append(String.format("\\u%04x", (int) ch));
            }
        }
        return builder.toString();
    }
}
