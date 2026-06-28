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
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

public class import_xiaoyou_speaking_beginner_wordbook {
    private static final String JSON_PATH = "doc/generated/xiaoyou-speaking-beginner-wordbook.json";
    private static final String JDBC_URL = "jdbc:mysql://sh-cynosdbmysql-grp-ft100p3o.sql.tencentcdb.com:29616/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=120000";
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
                long bookId = insertWordBook(conn, bookName, text(book, "description"), text(book, "scene"), text(book, "level"), text(book, "status"));
                Map<Long, TopicMeta> topics = collectTopics(words);
                int linkedBookTopics = insertWordBookTopics(conn, bookId, topics.keySet());
                ImportResult result = insertWordsAndTopics(conn, bookId, words);
                Verification verification = verifyCounts(conn, bookId);
                if (result.insertedWords != 1000
                        || result.insertedWordTopics != 1000
                        || verification.total != 1000
                        || verification.beginner != 1000
                        || verification.advanced != 0
                        || verification.published != 1000
                        || verification.pendingAudio != 1000
                        || verification.definitionLabelHits != 0
                        || verification.linkedTopics != topics.size()) {
                    throw new IllegalStateException("Import verification failed: "
                            + "insertedWords=" + result.insertedWords
                            + ", insertedWordTopics=" + result.insertedWordTopics
                            + ", total=" + verification.total
                            + ", beginner=" + verification.beginner
                            + ", advanced=" + verification.advanced
                            + ", published=" + verification.published
                            + ", linkedTopics=" + verification.linkedTopics
                            + ", expectedLinkedTopics=" + topics.size());
                }
                conn.commit();
                System.out.println("IMPORT_OK");
                System.out.println("wordBookId=" + bookId);
                System.out.println("wordBookName=" + ascii(bookName));
                System.out.println("insertedWords=" + result.insertedWords);
                System.out.println("insertedWordTopics=" + result.insertedWordTopics);
                System.out.println("linkedBookTopics=" + linkedBookTopics);
                System.out.println("total=" + verification.total);
                System.out.println("beginner=" + verification.beginner);
                System.out.println("advanced=" + verification.advanced);
                System.out.println("published=" + verification.published);
                System.out.println("linkedTopics=" + verification.linkedTopics);
            } catch (Exception e) {
                conn.rollback();
                throw e;
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

    private static long insertWordBook(Connection conn, String name, String description, String scene, String level, String status) throws SQLException {
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

    private static Map<Long, TopicMeta> collectTopics(JsonNode words) {
        Map<Long, TopicMeta> topics = new LinkedHashMap<Long, TopicMeta>();
        for (JsonNode word : words) {
            long topicId = word.get("sourceTopicId").asLong();
            if (!topics.containsKey(topicId)) {
                topics.put(topicId, new TopicMeta(
                        topicId,
                        text(word, "sourceTopicTitleEn"),
                        text(word, "sourceTopicTitle")));
            }
        }
        return topics;
    }

    private static int insertWordBookTopics(Connection conn, long bookId, Set<Long> topicIds) throws SQLException {
        String sql = "insert into word_book_topics (word_book_id, topic_id, created_at) values (?, ?, now())";
        int inserted = 0;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (Long topicId : topicIds) {
                ps.setLong(1, bookId);
                ps.setLong(2, topicId.longValue());
                ps.addBatch();
            }
            int[] results = ps.executeBatch();
            inserted = countBatch(results);
        }
        return inserted;
    }

    private static ImportResult insertWordsAndTopics(Connection conn, long bookId, JsonNode words) throws SQLException {
        String wordSql = "insert into words ("
                + "word_book_id, word, normalized_word, difficulty, status, phonetic, part_of_speech, "
                + "definition_zh, definition_en, common_patterns, example_en, example_zh, "
                + "source_scene, source_topic_id, source_topic_title, "
                + "audio_us_url, audio_uk_url, example_audio_us_url, example_audio_uk_url, "
                + "audio_status, audio_error, sort_order, deleted, created_at, updated_at"
                + ") values ("
                + "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, null, null, null, "
                + "'PENDING', null, ?, false, ?, ?"
                + ")";
        String topicSql = "insert into word_topics (word_id, topic_id, topic_title_en, topic_title_zh, created_at) "
                + "values (?, ?, ?, ?, now())";

        Set<String> normalizedSeen = new LinkedHashSet<String>();
        int insertedWords = 0;
        int insertedWordTopics = 0;
        try (PreparedStatement wordPs = conn.prepareStatement(wordSql, Statement.RETURN_GENERATED_KEYS);
             PreparedStatement topicPs = conn.prepareStatement(topicSql)) {
            for (JsonNode word : words) {
                String value = text(word, "word");
                String normalized = normalize(value);
                if (isBlank(normalized) || normalizedSeen.contains(normalized) || !normalized.matches("[a-z]+")) {
                    throw new IllegalArgumentException("Duplicate or blank word in JSON: " + value);
                }
                normalizedSeen.add(normalized);
                Timestamp now = Timestamp.valueOf(LocalDateTime.now());

                wordPs.setLong(1, bookId);
                wordPs.setString(2, value);
                wordPs.setString(3, normalized);
                wordPs.setString(4, text(word, "difficulty"));
                wordPs.setString(5, text(word, "status"));
                wordPs.setString(6, blankToNull(text(word, "phonetic")));
                wordPs.setString(7, text(word, "partOfSpeech"));
                wordPs.setString(8, text(word, "definitionZh"));
                wordPs.setString(9, text(word, "definitionEn"));
                wordPs.setString(10, text(word, "commonPatterns"));
                wordPs.setString(11, text(word, "exampleEn"));
                wordPs.setString(12, text(word, "exampleZh"));
                wordPs.setString(13, text(word, "sourceScene"));
                wordPs.setLong(14, word.get("sourceTopicId").asLong());
                wordPs.setString(15, text(word, "sourceTopicTitle"));
                wordPs.setInt(16, word.get("sortOrder").asInt());
                wordPs.setTimestamp(17, now);
                wordPs.setTimestamp(18, now);
                insertedWords += wordPs.executeUpdate();

                long wordId;
                try (ResultSet keys = wordPs.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException("No generated key for word: " + value);
                    }
                    wordId = keys.getLong(1);
                }

                topicPs.setLong(1, wordId);
                topicPs.setLong(2, word.get("sourceTopicId").asLong());
                topicPs.setString(3, text(word, "sourceTopicTitleEn"));
                topicPs.setString(4, text(word, "sourceTopicTitle"));
                insertedWordTopics += topicPs.executeUpdate();
            }
        }
        return new ImportResult(insertedWords, insertedWordTopics);
    }

    private static Verification verifyCounts(Connection conn, long bookId) throws SQLException {
        Verification verification = new Verification();
        try (PreparedStatement ps = conn.prepareStatement(
                "select count(*) total, "
                        + "sum(case when difficulty='BEGINNER' then 1 else 0 end) beginner, "
                        + "sum(case when difficulty='ADVANCED' then 1 else 0 end) advanced, "
                        + "sum(case when status='PUBLISHED' then 1 else 0 end) published, "
                        + "sum(case when audio_status='PENDING' then 1 else 0 end) pending_audio, "
                        + "sum(case when definition_zh like '%小柚口语初级%' or definition_zh like '%初级%' then 1 else 0 end) definition_label_hits "
                        + "from words where word_book_id = ? and deleted = false")) {
            ps.setLong(1, bookId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                verification.total = rs.getLong("total");
                verification.beginner = rs.getLong("beginner");
                verification.advanced = rs.getLong("advanced");
                verification.published = rs.getLong("published");
                verification.pendingAudio = rs.getLong("pending_audio");
                verification.definitionLabelHits = rs.getLong("definition_label_hits");
            }
        }
        try (PreparedStatement ps = conn.prepareStatement(
                "select count(*) from word_book_topics where word_book_id = ?")) {
            ps.setLong(1, bookId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                verification.linkedTopics = rs.getLong(1);
            }
        }
        return verification;
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
            System.out.println("book.linkedTopics=" + verification.linkedTopics);
            try (PreparedStatement ps = conn.prepareStatement(
                    "select word, definition_zh, source_topic_title from words where word_book_id = ? order by sort_order asc limit 1")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        System.out.println("first.word=" + rs.getString("word"));
                        System.out.println("first.definitionZh=" + ascii(rs.getString("definition_zh")));
                        System.out.println("first.sourceTopicTitle=" + ascii(rs.getString("source_topic_title")));
                    }
                }
            }
        }
    }

    private static int countBatch(int[] results) {
        int count = 0;
        for (int result : results) {
            if (result >= 0) {
                count += result;
            } else if (result == Statement.SUCCESS_NO_INFO) {
                count++;
            }
        }
        return count;
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

    private static class TopicMeta {
        private final long id;
        private final String titleEn;
        private final String titleZh;

        private TopicMeta(long id, String titleEn, String titleZh) {
            this.id = id;
            this.titleEn = titleEn;
            this.titleZh = titleZh;
        }
    }

    private static class ImportResult {
        private final int insertedWords;
        private final int insertedWordTopics;

        private ImportResult(int insertedWords, int insertedWordTopics) {
            this.insertedWords = insertedWords;
            this.insertedWordTopics = insertedWordTopics;
        }
    }

    private static class Verification {
        private long total;
        private long beginner;
        private long advanced;
        private long published;
        private long linkedTopics;
        private long pendingAudio;
        private long definitionLabelHits;
    }
}
