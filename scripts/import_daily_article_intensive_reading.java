import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class import_daily_article_intensive_reading {
    private static final String DEFAULT_JSON_PATH = "doc/generated/daily-article-intensive-reading.template.json";
    private static final String JDBC_URL = env("XIAOYOU_DB_URL",
            "jdbc:mysql://139.196.43.133:3306/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=60000");
    private static final String USERNAME = env("XIAOYOU_DB_USERNAME", "root");
    private static final String PASSWORD = env("XIAOYOU_DB_PASSWORD", "");

    public static void main(String[] args) throws Exception {
        if (args.length >= 2 && "verify".equals(args[0])) {
            verify(Long.parseLong(args[1]));
            return;
        }

        String jsonPath = args.length >= 1 ? args[0] : DEFAULT_JSON_PATH;
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(new File(jsonPath));
        validate(root);

        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
            conn.setAutoCommit(false);
            try {
                long articleId = insertArticle(conn, mapper, root);
                int paragraphs = insertParagraphs(conn, articleId, root.path("paragraphs"));
                Verification verification = verifyCounts(conn, articleId);
                if (paragraphs != verification.paragraphs) {
                    throw new IllegalStateException("Paragraph verification failed: inserted=" + paragraphs
                            + ", actual=" + verification.paragraphs);
                }
                conn.commit();
                System.out.println("IMPORT_OK");
                System.out.println("articleId=" + articleId);
                System.out.println("paragraphs=" + verification.paragraphs);
                System.out.println("vocabulary=" + arraySize(root.path("vocabulary")));
                System.out.println("keySentences=" + arraySize(root.path("keySentences")));
                System.out.println("status=" + status(root));
                System.out.println("publishedDate=" + nullableText(root, "publishedDate"));
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }
    }

    private static void validate(JsonNode root) {
        if (isBlank(text(root, "title"))) {
            throw new IllegalArgumentException("title is required");
        }
        JsonNode paragraphs = root.path("paragraphs");
        if (!paragraphs.isArray() || paragraphs.size() == 0) {
            throw new IllegalArgumentException("paragraphs must be a non-empty array");
        }
    }

    private static long insertArticle(Connection conn, ObjectMapper mapper, JsonNode root) throws Exception {
        String sql = "insert into daily_articles ("
                + "title, title_zh, audio_url, summary, vocabulary, expressions, "
                + "difficulty_stars, word_count, source_name, key_sentences, "
                + "status, published_date, created_at, updated_at"
                + ") values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            Timestamp now = Timestamp.valueOf(LocalDateTime.now());
            ps.setString(1, text(root, "title"));
            ps.setString(2, blankToNull(text(root, "titleZh")));
            ps.setString(3, blankToNull(text(root, "audioUrl")));
            ps.setString(4, blankToNull(text(root, "summary")));
            ps.setString(5, jsonArray(mapper, root.path("vocabulary")));
            ps.setString(6, jsonArray(mapper, root.path("expressions")));
            setInteger(ps, 7, normalizeDifficulty(root.get("difficultyStars")));
            setInteger(ps, 8, normalizePositiveInt(root.get("wordCount")));
            ps.setString(9, blankToNull(text(root, "sourceName")));
            ps.setString(10, jsonArray(mapper, root.path("keySentences")));
            ps.setString(11, status(root));
            setDate(ps, 12, nullableText(root, "publishedDate"));
            ps.setTimestamp(13, now);
            ps.setTimestamp(14, now);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (!keys.next()) {
                    throw new SQLException("No generated key for daily_articles");
                }
                return keys.getLong(1);
            }
        }
    }

    private static int insertParagraphs(Connection conn, long articleId, JsonNode paragraphs) throws SQLException {
        String sql = "insert into daily_article_paragraphs "
                + "(article_id, sort_order, content_en, content_zh) values (?, ?, ?, ?)";
        int inserted = 0;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            int fallbackOrder = 1;
            for (JsonNode paragraph : paragraphs) {
                String contentEn = blankToNull(text(paragraph, "contentEn"));
                String contentZh = blankToNull(text(paragraph, "contentZh"));
                if (contentEn == null && contentZh == null) {
                    continue;
                }
                ps.setLong(1, articleId);
                ps.setInt(2, paragraph.hasNonNull("sortOrder") ? paragraph.get("sortOrder").asInt() : fallbackOrder);
                ps.setString(3, contentEn);
                ps.setString(4, contentZh);
                ps.addBatch();
                fallbackOrder++;
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

    private static void verify(long articleId) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "select id, title, title_zh, status, published_date, difficulty_stars, word_count, source_name, "
                            + "json_length(coalesce(vocabulary, json_array())) vocabulary_count, "
                            + "json_length(coalesce(key_sentences, json_array())) key_sentence_count "
                            + "from daily_articles where id = ?")) {
                ps.setLong(1, articleId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("daily article not found: " + articleId);
                    }
                    System.out.println("article.id=" + rs.getLong("id"));
                    System.out.println("article.title=" + ascii(rs.getString("title")));
                    System.out.println("article.titleZh=" + ascii(rs.getString("title_zh")));
                    System.out.println("article.status=" + rs.getString("status"));
                    System.out.println("article.publishedDate=" + rs.getString("published_date"));
                    System.out.println("article.difficultyStars=" + rs.getString("difficulty_stars"));
                    System.out.println("article.wordCount=" + rs.getString("word_count"));
                    System.out.println("article.sourceName=" + ascii(rs.getString("source_name")));
                    System.out.println("article.vocabulary=" + rs.getInt("vocabulary_count"));
                    System.out.println("article.keySentences=" + rs.getInt("key_sentence_count"));
                }
            }
            Verification verification = verifyCounts(conn, articleId);
            System.out.println("article.paragraphs=" + verification.paragraphs);
        }
    }

    private static Verification verifyCounts(Connection conn, long articleId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "select count(*) paragraphs from daily_article_paragraphs where article_id = ?")) {
            ps.setLong(1, articleId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return new Verification(rs.getInt("paragraphs"));
            }
        }
    }

    private static String jsonArray(ObjectMapper mapper, JsonNode node) throws Exception {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (!node.isArray()) {
            throw new IllegalArgumentException("Expected JSON array, got: " + node);
        }
        return mapper.writeValueAsString(node);
    }

    private static int arraySize(JsonNode node) {
        return node != null && node.isArray() ? node.size() : 0;
    }

    private static Integer normalizeDifficulty(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        int value = node.asInt();
        return Math.max(1, Math.min(5, value));
    }

    private static Integer normalizePositiveInt(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        int value = node.asInt();
        return value > 0 ? value : null;
    }

    private static String status(JsonNode root) {
        String value = text(root, "status");
        return isBlank(value) ? "ENABLED" : value.trim();
    }

    private static void setInteger(PreparedStatement ps, int index, Integer value) throws SQLException {
        if (value == null) {
            ps.setNull(index, java.sql.Types.INTEGER);
        } else {
            ps.setInt(index, value);
        }
    }

    private static void setDate(PreparedStatement ps, int index, String value) throws SQLException {
        if (isBlank(value)) {
            ps.setNull(index, java.sql.Types.DATE);
        } else {
            ps.setDate(index, Date.valueOf(LocalDate.parse(value.trim())));
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static String nullableText(JsonNode node, String field) {
        String value = text(node, field);
        return isBlank(value) || "null".equalsIgnoreCase(value.trim()) ? null : value.trim();
    }

    private static String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return isBlank(value) ? fallback : value;
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

    private record Verification(int paragraphs) {
    }
}
