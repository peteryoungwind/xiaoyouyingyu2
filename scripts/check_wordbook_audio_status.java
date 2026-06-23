import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class check_wordbook_audio_status {
    private static final String JDBC_URL = "jdbc:mysql://sh-cynosdbmysql-grp-ft100p3o.sql.tencentcdb.com:29616/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=60000";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "pzq915981048.";

    public static void main(String[] args) throws Exception {
        long bookId = args.length > 0 ? Long.parseLong(args[0]) : 5L;
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "select id, name, provider, model_name, voice_us, voice_uk, output_format, is_default, enabled "
                            + "from tts_models where enabled = true order by is_default desc, created_at desc")) {
                try (ResultSet rs = ps.executeQuery()) {
                    System.out.println("TTS_MODELS");
                    while (rs.next()) {
                        System.out.println("id=" + rs.getLong("id")
                                + ", name=" + ascii(rs.getString("name"))
                                + ", provider=" + rs.getString("provider")
                                + ", model=" + rs.getString("model_name")
                                + ", us=" + rs.getString("voice_us")
                                + ", uk=" + rs.getString("voice_uk")
                                + ", format=" + rs.getString("output_format")
                                + ", default=" + rs.getBoolean("is_default")
                                + ", enabled=" + rs.getBoolean("enabled"));
                    }
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(
                    "select audio_status, count(*) cnt from words where word_book_id = ? and deleted = false group by audio_status")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    System.out.println("AUDIO_STATUS");
                    while (rs.next()) {
                        System.out.println(rs.getString("audio_status") + "=" + rs.getLong("cnt"));
                    }
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(
                    "select count(*) total, "
                            + "sum(case when phonetic is not null and phonetic <> '' then 1 else 0 end) phonetic_done, "
                            + "sum(case when audio_us_url is not null and audio_us_url <> '' then 1 else 0 end) word_us_done, "
                            + "sum(case when example_audio_us_url is not null and example_audio_us_url <> '' then 1 else 0 end) example_us_done "
                            + "from words where word_book_id = ? and deleted = false")) {
                ps.setLong(1, bookId);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    System.out.println("COUNTS total=" + rs.getLong("total")
                            + ", phonetic_done=" + rs.getLong("phonetic_done")
                            + ", word_us_done=" + rs.getLong("word_us_done")
                            + ", example_us_done=" + rs.getLong("example_us_done"));
                }
            }
        }
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
}
