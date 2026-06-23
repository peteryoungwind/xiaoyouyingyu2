import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class export_topics_for_wordbook {
    private static final String JDBC_URL = "jdbc:mysql://sh-cynosdbmysql-grp-ft100p3o.sql.tencentcdb.com:29616/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&connectTimeout=10000&socketTimeout=60000";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "pzq915981048.";

    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        List<Map<String, Object>> topics = new ArrayList<Map<String, Object>>();
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
             PreparedStatement ps = conn.prepareStatement(
                     "select id, title, title_zh, tags, questions, event_date "
                             + "from topics order by event_date desc, id desc");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> topic = new LinkedHashMap<String, Object>();
                topic.put("id", rs.getLong("id"));
                topic.put("title", rs.getString("title"));
                topic.put("titleZh", rs.getString("title_zh"));
                topic.put("tags", rs.getString("tags"));
                topic.put("questions", rs.getString("questions"));
                topic.put("eventDate", String.valueOf(rs.getDate("event_date")));
                topics.add(topic);
            }
        }

        Map<String, Object> root = new LinkedHashMap<String, Object>();
        root.put("count", topics.size());
        root.put("topics", topics);
        File out = new File("doc/generated/xiaoyou-topic-snapshot.json");
        out.getParentFile().mkdirs();
        new ObjectMapper().writerWithDefaultPrettyPrinter().writeValue(out, root);
        System.out.println("topics=" + topics.size());
        System.out.println("output=" + out.getPath());
    }
}
