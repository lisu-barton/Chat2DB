package ai.chat2db.server.start.config.util;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;

import java.util.HashMap;
import java.util.Map;

public class LdapUtils {


    /**
     * 获取 ldap Template
     * @return
     */
    public static LdapTemplate template(String dataConfig) {
        JSONObject parse = JSON.parseObject(dataConfig);

        LdapContextSource contextSource = new LdapContextSource();
        Map<String, Object> config = new HashMap();

        contextSource.setUrl(parse.getString("urls"));
        contextSource.setBase(parse.getString("baseDn"));
        contextSource.setUserDn(parse.getString("username"));
        contextSource.setPassword(parse.getString("password"));

//        contextSource.setUrl("ldap://10.102.129.5:3268");
//        contextSource.setBase("dc=cn,dc=primerobotics,dc=com");
//        contextSource.setUserDn("jenkins");
//        contextSource.setPassword("Prime@2023@Jenkins");

        //  解决 乱码 的关键一句
        config.put("java.naming.ldap.attributes.binary", "objectGUID");

        //当需要连接时，池是否一定创建新连接
        contextSource.setPooled(true);
        contextSource.setBaseEnvironmentProperties(config);

        return new LdapTemplate(contextSource);
    }


}
