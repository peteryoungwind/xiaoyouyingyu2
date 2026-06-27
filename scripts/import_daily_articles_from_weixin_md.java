import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class import_daily_articles_from_weixin_md {
    private static final String DEFAULT_MD_DIR =
            "/Users/admin/Documents/Codex/2026-06-26/https-mp-weixin-qq-com-s-2/outputs/weixin_articles_md";
    private static final String DEFAULT_OUT_DIR = "doc/generated/daily-articles-intensive-reading-batch";
    private static final ObjectMapper MAPPER = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    private static final Pattern H1 = Pattern.compile("^#\\s+(.+)$");
    private static final Pattern META = Pattern.compile("^-\\s*([^：:]+)[：:]\\s*(.+)$");
    private static final Pattern WORD_COUNT = Pattern.compile("(?:本文字数|文章字数)[：:]\\s*(\\d+)");
    private static final Pattern DIFFICULTY = Pattern.compile("(?:难度星级|文章难度)[：:]\\s*([★☆]+)");
    private static final Pattern SOURCE = Pattern.compile("^\\*{0,2}来源[：:]\\s*(.+?)\\*{0,2}$");
    private static final Pattern AUTHOR = Pattern.compile("^\\*{0,2}作者[：:]\\s*(.+?)\\*{0,2}$");
    private static final Pattern ORIGINAL_TITLE = Pattern.compile("^\\*{0,2}原文标题[：:]\\s*(.+?)\\*{0,2}$");
    private static final Pattern VOCAB_HEADING = Pattern.compile("^\\*+\\s*\\d+[、.]\\s*(.+?)\\s*\\**$");
    private static final Pattern PHONETIC = Pattern.compile("英/\\s*([^/]+?)\\s*/(?:\\s*[｜|]\\s*美/\\s*([^/]+?)\\s*/)?");
    private static final Pattern WRITING_PATTERN = Pattern.compile("^[⭐️★❄️🎄\\s]*\\*+\\s*(?:P\\d+\\s*[｜|])?(.+?)\\s*\\*+$");

    public static void main(String[] args) throws Exception {
        String mode = args.length == 0 ? "convert-import" : args[0];
        Path mdDir = Path.of(args.length >= 2 ? args[1] : DEFAULT_MD_DIR);
        Path outDir = Path.of(args.length >= 3 ? args[2] : DEFAULT_OUT_DIR);

        if ("convert".equals(mode)) {
            List<Article> articles = convert(mdDir, outDir);
            printConversionSummary(articles);
            return;
        }
        if ("import".equals(mode)) {
            ImportSummary summary = importJsonDir(outDir);
            printImportSummary(summary);
            return;
        }
        if ("convert-import".equals(mode)) {
            List<Article> articles = convert(mdDir, outDir);
            printConversionSummary(articles);
            ImportSummary summary = importJsonDir(outDir);
            printImportSummary(summary);
            return;
        }

        throw new IllegalArgumentException("Usage: java import_daily_articles_from_weixin_md "
                + "[convert|import|convert-import] [mdDir] [outDir]");
    }

    private static List<Article> convert(Path mdDir, Path outDir) throws IOException {
        Files.createDirectories(outDir);
        List<Path> files;
        try (var stream = Files.list(mdDir)) {
            files = stream
                    .filter(path -> path.getFileName().toString().endsWith(".md"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .toList();
        }

        List<Article> articles = new ArrayList<>();
        for (Path file : files) {
            Article article = parseMarkdown(file);
            articles.add(article);
            Path target = outDir.resolve(slug(file.getFileName().toString().replaceFirst("\\.md$", "")) + ".json");
            MAPPER.writeValue(target.toFile(), toJson(article));
        }
        return articles;
    }

    private static Article parseMarkdown(Path file) throws IOException {
        List<String> rawLines = Files.readAllLines(file, StandardCharsets.UTF_8);
        List<String> lines = rawLines.stream().map(import_daily_articles_from_weixin_md::cleanLine).toList();
        Article article = new Article();
        article.file = file;
        article.status = "ENABLED";

        for (String line : lines) {
            Matcher h1 = H1.matcher(line);
            if (h1.find()) {
                article.titleZh = cleanTitleZh(h1.group(1));
                break;
            }
        }

        for (String line : lines) {
            if (line.startsWith("> ") && !line.contains("[音频]")) {
                article.title = stripMarkdown(line.substring(2));
                break;
            }
        }

        for (String line : lines) {
            Matcher meta = META.matcher(line);
            if (meta.find()) {
                String key = meta.group(1).trim();
                String value = meta.group(2).trim();
                if ("音频直链".equals(key)) {
                    article.audioUrl = value;
                } else if ("发布时间".equals(key)) {
                    article.sourcePublishedAt = value;
                } else if ("公众号".equals(key)) {
                    article.accountName = value;
                } else if ("原文链接".equals(key)) {
                    article.sourceUrl = value;
                }
            }
            Matcher wordCount = WORD_COUNT.matcher(line);
            if (wordCount.find()) {
                article.wordCount = Integer.parseInt(wordCount.group(1));
            }
            Matcher difficulty = DIFFICULTY.matcher(line);
            if (difficulty.find()) {
                article.difficultyStars = countStars(difficulty.group(1));
            }
            Matcher source = SOURCE.matcher(line);
            if (source.find()) {
                article.sourceName = stripMarkdown(source.group(1));
            }
            Matcher author = AUTHOR.matcher(line);
            if (author.find()) {
                article.author = stripMarkdown(author.group(1));
            }
            Matcher original = ORIGINAL_TITLE.matcher(line);
            if (original.find()) {
                article.originalTitle = stripMarkdown(original.group(1));
            }
        }

        if (isBlank(article.title) && !isBlank(article.originalTitle)) {
            article.title = article.originalTitle;
        }
        if (isBlank(article.title)) {
            article.title = article.titleZh;
        }
        if (isBlank(article.sourceName)) {
            article.sourceName = article.accountName;
        }

        int bodyStart = indexOfContains(lines, "双语正文");
        int sourceStart = firstIndexOfAny(lines, bodyStart + 1, "来源：", "**来源：", "写作积累", "阅读打卡", "PDF文件");
        List<String> bodyLines = slice(lines, bodyStart + 1, sourceStart < 0 ? lines.size() : sourceStart);
        article.paragraphs = parseParagraphs(bodyLines);
        article.vocabulary = parseVocabulary(bodyLines);

        int writingStart = indexOfContains(lines, "写作积累");
        int writingEnd = firstIndexOfAny(lines, writingStart + 1, "阅读打卡", "PDF文件");
        if (writingStart >= 0) {
            List<String> writingLines = slice(lines, writingStart + 1, writingEnd < 0 ? lines.size() : writingEnd);
            article.expressions = parseWritingExpressions(writingLines);
        }
        article.keySentences = buildKeySentences(article);
        article.summary = buildSummary(article);

        if (article.paragraphs.isEmpty()) {
            throw new IllegalStateException("No bilingual paragraphs parsed: " + file);
        }
        return article;
    }

    private static List<Paragraph> parseParagraphs(List<String> lines) {
        List<String> blocks = blocks(lines);
        List<Paragraph> paragraphs = new ArrayList<>();
        for (int i = 0; i < blocks.size(); i++) {
            String current = blocks.get(i);
            if (!isArticleEnglishParagraph(current)) {
                continue;
            }
            int nextIndex = i + 1;
            while (nextIndex < blocks.size() && shouldSkipBetweenParagraphPair(blocks.get(nextIndex))) {
                nextIndex++;
            }
            if (nextIndex < blocks.size() && isChineseParagraph(blocks.get(nextIndex))) {
                Paragraph paragraph = new Paragraph();
                paragraph.sortOrder = paragraphs.size() + 1;
                paragraph.contentEn = stripMarkdown(current);
                paragraph.contentZh = stripMarkdown(blocks.get(nextIndex));
                paragraphs.add(paragraph);
                i = nextIndex;
            }
        }
        return paragraphs;
    }

    private static List<Vocabulary> parseVocabulary(List<String> lines) {
        List<String> blocks = blocks(lines);
        List<Vocabulary> result = new ArrayList<>();
        for (int i = 0; i < blocks.size(); i++) {
            String block = blocks.get(i);
            Matcher heading = VOCAB_HEADING.matcher(block);
            if (!heading.find()) {
                continue;
            }
            Vocabulary vocabulary = new Vocabulary();
            vocabulary.word = cleanVocabWord(heading.group(1));
            List<String> detailBlocks = new ArrayList<>();
            int j = i + 1;
            while (j < blocks.size()) {
                String next = blocks.get(j);
                if (VOCAB_HEADING.matcher(next).find() || isArticleEnglishParagraph(next)) {
                    break;
                }
                if (!isMarkdownImage(next)) {
                    detailBlocks.add(next);
                }
                j++;
            }
            fillVocabulary(vocabulary, detailBlocks);
            if (!isBlank(vocabulary.word)) {
                result.add(vocabulary);
            }
            i = j - 1;
        }
        return result;
    }

    private static void fillVocabulary(Vocabulary vocabulary, List<String> detailBlocks) {
        List<String> meaningLines = new ArrayList<>();
        for (String block : detailBlocks) {
            Matcher phonetic = PHONETIC.matcher(block);
            if (phonetic.find()) {
                vocabulary.phoneticUk = normalizePhonetic(phonetic.group(1));
                vocabulary.phoneticUs = normalizePhonetic(phonetic.group(2));
                continue;
            }
            String text = stripMarkdown(block);
            if (!isBlank(text)) {
                meaningLines.add(text);
            }
        }
        if (!meaningLines.isEmpty()) {
            String meaning = String.join("\n", meaningLines).trim();
            Matcher pos = Pattern.compile("^([a-z]+\\.)\\s*(.+)$").matcher(meaning);
            if (pos.find()) {
                vocabulary.pos = pos.group(1);
                vocabulary.meaning = pos.group(2).trim();
            } else {
                vocabulary.meaning = meaning;
            }
        }
    }

    private static List<Expression> parseWritingExpressions(List<String> lines) {
        List<String> blocks = blocks(lines);
        List<Expression> expressions = new ArrayList<>();
        for (int i = 0; i < blocks.size(); i++) {
            Matcher heading = WRITING_PATTERN.matcher(blocks.get(i));
            if (!heading.find()) {
                continue;
            }
            Expression expression = new Expression();
            expression.expression = stripMarkdown(heading.group(1));
            int j = i + 1;
            while (j < blocks.size()) {
                Matcher nextHeading = WRITING_PATTERN.matcher(blocks.get(j));
                if (nextHeading.find()) {
                    break;
                }
                String text = stripMarkdown(blocks.get(j));
                if (text.startsWith("释义：")) {
                    expression.meaning = text.substring("释义：".length()).trim();
                } else if (text.startsWith("例句：")) {
                    expression.example = text.substring("例句：".length()).trim();
                } else if (text.startsWith("翻译：")) {
                    expression.exampleZh = text.substring("翻译：".length()).trim();
                }
                j++;
            }
            if (!isBlank(expression.expression)) {
                expressions.add(expression);
            }
            i = j - 1;
        }
        return expressions;
    }

    private static List<KeySentence> buildKeySentences(Article article) {
        List<KeySentence> result = new ArrayList<>();
        for (Expression expression : article.expressions) {
            KeySentence keySentence = new KeySentence();
            keySentence.sentence = expression.expression;
            keySentence.translation = expression.meaning;
            StringBuilder analysis = new StringBuilder("写作积累句型");
            if (!isBlank(expression.example)) {
                analysis.append("\n例句：").append(expression.example);
            }
            if (!isBlank(expression.exampleZh)) {
                analysis.append("\n翻译：").append(expression.exampleZh);
            }
            keySentence.analysis = analysis.toString();
            result.add(keySentence);
        }
        if (!result.isEmpty()) {
            return result;
        }

        return article.paragraphs.stream()
                .filter(paragraph -> paragraph.contentEn.length() > 160)
                .limit(2)
                .map(paragraph -> {
                    KeySentence keySentence = new KeySentence();
                    keySentence.sentence = firstSentence(paragraph.contentEn);
                    keySentence.translation = paragraph.contentZh;
                    keySentence.analysis = "原文长句，可结合上方逐段翻译精读。";
                    return keySentence;
                })
                .toList();
    }

    private static ObjectNode toJson(Article article) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("title", nullToEmpty(article.title));
        root.put("titleZh", nullToEmpty(article.titleZh));
        root.put("audioUrl", nullToEmpty(article.audioUrl));
        if (article.difficultyStars == null) {
            root.putNull("difficultyStars");
        } else {
            root.put("difficultyStars", article.difficultyStars);
        }
        if (article.wordCount == null) {
            root.putNull("wordCount");
        } else {
            root.put("wordCount", article.wordCount);
        }
        root.put("sourceName", nullToEmpty(article.sourceName));
        root.put("summary", nullToEmpty(article.summary));
        root.put("status", article.status);
        root.putNull("publishedDate");

        ArrayNode paragraphs = root.putArray("paragraphs");
        for (Paragraph paragraph : article.paragraphs) {
            ObjectNode node = paragraphs.addObject();
            node.put("sortOrder", paragraph.sortOrder);
            node.put("contentEn", paragraph.contentEn);
            node.put("contentZh", paragraph.contentZh);
        }

        ArrayNode vocabulary = root.putArray("vocabulary");
        for (Vocabulary item : article.vocabulary) {
            ObjectNode node = vocabulary.addObject();
            node.put("word", nullToEmpty(item.word));
            node.put("phoneticUk", nullToEmpty(item.phoneticUk));
            node.put("phoneticUs", nullToEmpty(item.phoneticUs));
            node.put("pos", nullToEmpty(item.pos));
            node.put("meaning", nullToEmpty(item.meaning));
            node.put("example", "");
            node.put("exampleZh", "");
        }

        ArrayNode expressions = root.putArray("expressions");
        for (Expression item : article.expressions) {
            ObjectNode node = expressions.addObject();
            node.put("expression", nullToEmpty(item.expression));
            node.put("meaning", nullToEmpty(item.meaning));
            node.put("example", nullToEmpty(item.example));
            if (!isBlank(item.exampleZh)) {
                node.put("exampleZh", item.exampleZh);
            }
        }

        ArrayNode keySentences = root.putArray("keySentences");
        for (KeySentence item : article.keySentences) {
            ObjectNode node = keySentences.addObject();
            node.put("sentence", nullToEmpty(item.sentence));
            node.put("translation", nullToEmpty(item.translation));
            node.put("analysis", nullToEmpty(item.analysis));
        }

        return root;
    }

    private static ImportSummary importJsonDir(Path jsonDir) throws Exception {
        List<Path> files;
        try (var stream = Files.list(jsonDir)) {
            files = stream.filter(path -> path.getFileName().toString().endsWith(".json"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .toList();
        }

        ImportSummary summary = new ImportSummary();
        String jdbcUrl = requiredEnv("XIAOYOU_DB_URL");
        String username = requiredEnv("XIAOYOU_DB_USERNAME");
        String password = requiredEnv("XIAOYOU_DB_PASSWORD");

        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            ensureSchema(conn);
            conn.setAutoCommit(false);
            try {
                for (Path file : files) {
                    ObjectNode root = (ObjectNode) MAPPER.readTree(file.toFile());
                    String title = text(root, "title");
                    String titleZh = text(root, "titleZh");
                    String audioUrl = text(root, "audioUrl");
                    if (exists(conn, title, titleZh, audioUrl)) {
                        summary.skipped++;
                        summary.skippedFiles.add(file.getFileName().toString());
                        continue;
                    }
                    long articleId = insertArticle(conn, root);
                    int paragraphs = insertParagraphs(conn, articleId, root.withArray("paragraphs"));
                    summary.inserted++;
                    summary.paragraphs += paragraphs;
                    summary.articleIds.add(articleId);
                }
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }
        summary.total = files.size();
        return summary;
    }

    private static void ensureSchema(Connection conn) throws SQLException {
        addColumnIfMissing(conn, "daily_articles", "difficulty_stars", "INT NULL");
        addColumnIfMissing(conn, "daily_articles", "word_count", "INT NULL");
        addColumnIfMissing(conn, "daily_articles", "source_name", "VARCHAR(200) NULL");
        addColumnIfMissing(conn, "daily_articles", "key_sentences", "JSON NULL");
    }

    private static void addColumnIfMissing(Connection conn, String table, String column, String definition)
            throws SQLException {
        try (ResultSet columns = conn.getMetaData().getColumns(conn.getCatalog(), null, table, column)) {
            if (columns.next()) {
                return;
            }
        }
        try (Statement statement = conn.createStatement()) {
            statement.executeUpdate("alter table " + table + " add column " + column + " " + definition);
        }
    }

    private static boolean exists(Connection conn, String title, String titleZh, String audioUrl) throws SQLException {
        String sql = "select id from daily_articles where title = ? or title_zh = ? or (audio_url is not null and audio_url = ?) limit 1";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, title);
            ps.setString(2, titleZh);
            ps.setString(3, audioUrl);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private static long insertArticle(Connection conn, ObjectNode root) throws Exception {
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
            ps.setString(5, MAPPER.writeValueAsString(root.withArray("vocabulary")));
            ps.setString(6, MAPPER.writeValueAsString(root.withArray("expressions")));
            setInteger(ps, 7, root.path("difficultyStars").isNumber() ? root.path("difficultyStars").asInt() : null);
            setInteger(ps, 8, root.path("wordCount").isNumber() ? root.path("wordCount").asInt() : null);
            ps.setString(9, blankToNull(text(root, "sourceName")));
            ps.setString(10, MAPPER.writeValueAsString(root.withArray("keySentences")));
            ps.setString(11, isBlank(text(root, "status")) ? "ENABLED" : text(root, "status"));
            ps.setNull(12, java.sql.Types.DATE);
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

    private static int insertParagraphs(Connection conn, long articleId, ArrayNode paragraphs) throws SQLException {
        String sql = "insert into daily_article_paragraphs "
                + "(article_id, sort_order, content_en, content_zh) values (?, ?, ?, ?)";
        int inserted = 0;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < paragraphs.size(); i++) {
                ObjectNode paragraph = (ObjectNode) paragraphs.get(i);
                ps.setLong(1, articleId);
                ps.setInt(2, paragraph.path("sortOrder").asInt(i + 1));
                ps.setString(3, blankToNull(text(paragraph, "contentEn")));
                ps.setString(4, blankToNull(text(paragraph, "contentZh")));
                ps.addBatch();
            }
            int[] results = ps.executeBatch();
            for (int result : results) {
                inserted += result >= 0 || result == Statement.SUCCESS_NO_INFO ? 1 : 0;
            }
        }
        return inserted;
    }

    private static String buildSummary(Article article) {
        StringBuilder builder = new StringBuilder();
        if (!article.paragraphs.isEmpty()) {
            builder.append(article.paragraphs.get(0).contentZh);
        }
        List<String> sourceParts = new ArrayList<>();
        if (!isBlank(article.sourceName)) sourceParts.add("来源：" + article.sourceName);
        if (!isBlank(article.author)) sourceParts.add("作者：" + article.author);
        if (!isBlank(article.sourcePublishedAt)) sourceParts.add("原文发布时间：" + article.sourcePublishedAt);
        if (!sourceParts.isEmpty()) {
            if (!builder.isEmpty()) builder.append("\n\n");
            builder.append(String.join("；", sourceParts));
        }
        return builder.toString();
    }

    private static List<String> blocks(List<String> lines) {
        List<String> blocks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String line : lines) {
            if (line.isBlank()) {
                if (!current.isEmpty()) {
                    blocks.add(current.toString().trim());
                    current.setLength(0);
                }
            } else {
                if (!current.isEmpty()) current.append("\n");
                current.append(line);
            }
        }
        if (!current.isEmpty()) blocks.add(current.toString().trim());
        return blocks;
    }

    private static boolean shouldSkipBetweenParagraphPair(String block) {
        return isMarkdownImage(block) || block.startsWith("> [音频]");
    }

    private static boolean isArticleEnglishParagraph(String block) {
        if (block.startsWith("**") || block.startsWith("#") || block.startsWith("- ") || block.startsWith("> ")) {
            return false;
        }
        if (isMarkdownImage(block) || block.contains("英/") || block.contains("美/")) {
            return false;
        }
        String text = stripMarkdown(block);
        if (looksLikeVocabularyDefinition(text)) {
            return false;
        }
        if (text.length() < 40 || text.endsWith(".pdf")) {
            return false;
        }
        int latin = countMatches(text, Character::isLetter);
        int cjk = countCjk(text);
        return latin > 30 && latin > cjk * 2;
    }

    private static boolean looksLikeVocabularyDefinition(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        return lower.matches("^(n|v|vi|vt|adj|adv|prep|phr|conj|pron|num|int)\\.\\s+.*")
                || lower.matches("^\\d+\\.\\s+.*");
    }

    private static boolean isChineseParagraph(String block) {
        if (block.startsWith("**") || block.startsWith("#") || block.startsWith("- ") || isMarkdownImage(block)) {
            return false;
        }
        String text = stripMarkdown(block);
        return countCjk(text) >= 12 && countCjk(text) >= countLatin(text) / 2;
    }

    private static boolean isMarkdownImage(String block) {
        return block.startsWith("![") || block.startsWith("[图片]");
    }

    private static String firstSentence(String text) {
        Matcher matcher = Pattern.compile("^(.+?[.!?])\\s+").matcher(text);
        return matcher.find() ? matcher.group(1).trim() : text;
    }

    private static String cleanLine(String line) {
        return line.replace('\u00A0', ' ').strip();
    }

    private static String cleanTitleZh(String value) {
        return stripMarkdown(value).replaceFirst("^\\d{8}\\s*[｜|]\\s*", "").trim();
    }

    private static String cleanVocabWord(String value) {
        return stripMarkdown(value)
                .replace("[研]", "")
                .replace("研", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String stripMarkdown(String value) {
        if (value == null) return "";
        return value
                .replace("⭐️", "")
                .replace("🎄", "")
                .replace("**", "")
                .replaceAll("\\[(研|音频)]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String normalizePhonetic(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").trim();
    }

    private static int countStars(String value) {
        int stars = 0;
        for (char ch : value.toCharArray()) {
            if (ch == '★') stars++;
        }
        return Math.max(1, Math.min(5, stars));
    }

    private static int countCjk(String value) {
        int count = 0;
        for (int i = 0; i < value.length(); i++) {
            Character.UnicodeScript script = Character.UnicodeScript.of(value.charAt(i));
            if (script == Character.UnicodeScript.HAN) count++;
        }
        return count;
    }

    private static int countLatin(String value) {
        int count = 0;
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) count++;
        }
        return count;
    }

    private static int countMatches(String value, CharPredicate predicate) {
        int count = 0;
        for (int i = 0; i < value.length(); i++) {
            if (predicate.test(value.charAt(i))) count++;
        }
        return count;
    }

    private static int indexOfContains(List<String> lines, String needle) {
        for (int i = 0; i < lines.size(); i++) {
            if (lines.get(i).contains(needle)) return i;
        }
        return -1;
    }

    private static int firstIndexOfAny(List<String> lines, int start, String... needles) {
        for (int i = Math.max(0, start); i < lines.size(); i++) {
            for (String needle : needles) {
                if (lines.get(i).contains(needle)) return i;
            }
        }
        return -1;
    }

    private static List<String> slice(List<String> lines, int start, int end) {
        if (start < 0) return List.of();
        return lines.subList(Math.min(start, lines.size()), Math.min(end, lines.size()));
    }

    private static String slug(String value) {
        return value.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private static String requiredEnv(String key) {
        String value = System.getenv(key);
        if (isBlank(value)) {
            throw new IllegalStateException("Missing required env: " + key);
        }
        return value;
    }

    private static String text(ObjectNode node, String field) {
        return node.path(field).isMissingNode() || node.path(field).isNull() ? null : node.path(field).asText();
    }

    private static String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static void setInteger(PreparedStatement ps, int index, Integer value) throws SQLException {
        if (value == null) {
            ps.setNull(index, java.sql.Types.INTEGER);
        } else {
            ps.setInt(index, value);
        }
    }

    private static void printConversionSummary(List<Article> articles) {
        int paragraphs = articles.stream().mapToInt(article -> article.paragraphs.size()).sum();
        int vocabulary = articles.stream().mapToInt(article -> article.vocabulary.size()).sum();
        int expressions = articles.stream().mapToInt(article -> article.expressions.size()).sum();
        System.out.println("CONVERT_OK");
        System.out.println("articles=" + articles.size());
        System.out.println("paragraphs=" + paragraphs);
        System.out.println("vocabulary=" + vocabulary);
        System.out.println("expressions=" + expressions);
        articles.stream()
                .filter(article -> article.paragraphs.size() < 2)
                .forEach(article -> System.out.println("WARN_LOW_PARAGRAPHS=" + article.file));
    }

    private static void printImportSummary(ImportSummary summary) {
        System.out.println("IMPORT_OK");
        System.out.println("total=" + summary.total);
        System.out.println("inserted=" + summary.inserted);
        System.out.println("skipped=" + summary.skipped);
        System.out.println("paragraphs=" + summary.paragraphs);
        if (!summary.articleIds.isEmpty()) {
            System.out.println("firstArticleId=" + summary.articleIds.get(0));
            System.out.println("lastArticleId=" + summary.articleIds.get(summary.articleIds.size() - 1));
        }
        if (!summary.skippedFiles.isEmpty()) {
            System.out.println("skippedFiles=" + String.join(",", summary.skippedFiles));
        }
    }

    private interface CharPredicate {
        boolean test(char ch);
    }

    private static class Article {
        Path file;
        String title;
        String titleZh;
        String audioUrl;
        Integer difficultyStars;
        Integer wordCount;
        String sourceName;
        String accountName;
        String author;
        String originalTitle;
        String sourcePublishedAt;
        String sourceUrl;
        String summary;
        String status;
        List<Paragraph> paragraphs = new ArrayList<>();
        List<Vocabulary> vocabulary = new ArrayList<>();
        List<Expression> expressions = new ArrayList<>();
        List<KeySentence> keySentences = new ArrayList<>();
    }

    private static class Paragraph {
        int sortOrder;
        String contentEn;
        String contentZh;
    }

    private static class Vocabulary {
        String word;
        String phoneticUk;
        String phoneticUs;
        String pos;
        String meaning;
    }

    private static class Expression {
        String expression;
        String meaning;
        String example;
        String exampleZh;
    }

    private static class KeySentence {
        String sentence;
        String translation;
        String analysis;
    }

    private static class ImportSummary {
        int total;
        int inserted;
        int skipped;
        int paragraphs;
        List<Long> articleIds = new ArrayList<>();
        List<String> skippedFiles = new ArrayList<>();
    }
}
