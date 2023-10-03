package ai.chat2db.server.start.controller.ldap;

import ai.chat2db.server.domain.api.model.Config;
import ai.chat2db.server.domain.api.service.ConfigService;
import ai.chat2db.server.start.config.util.LdapUtils;
import ai.chat2db.server.tools.base.wrapper.result.DataResult;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import java.util.Arrays;
import java.util.List;

import static org.springframework.ldap.query.LdapQueryBuilder.query;

@RestController
@RequestMapping("/api/ldap")
@Slf4j
public class LdapController {

    @Autowired
    private ConfigService configService;

    @Value("${chat2db.ldap.debug:true}")
    Boolean isDebug;

    /**
     * user
     *
     * @return
     */
    @GetMapping("list")
    public DataResult<List<JSONObject>> list() {
        DataResult<Config> dataResult = configService.find("ldap.setting.configure");
        if (!dataResult.getSuccess()) {
            return DataResult.error("", "Empty Ldap Setting");
        }

        if (isDebug) {
            JSONObject object = new JSONObject();
            object.put("email", "ldap@gmail.com");
            object.put("nickName", "chat2db ldap");
            object.put("userName", "chat2db.ldap");

            return DataResult.of(Arrays.asList(object));
        }

        // 能正常使用的用户
        List<JSONObject> result = LdapUtils.template(dataResult.getData().getContent()).search(
                query().where("objectCategory").is("person").and("UserAccountControl").is("66048"),
                new AttributesMapper<JSONObject>() {
                    public JSONObject mapFromAttributes(Attributes attrs) throws NamingException {
                        JSONObject object = new JSONObject();
                        object.put("email", attrs.get("userPrincipalName").get());
                        object.put("nickName", attrs.get("displayName").get());
                        object.put("userName", attrs.get("sAMAccountName").get());
                        return object;
                    }
                });

        return DataResult.of(result);
    }

    @PostMapping("login")
    public DataResult<Boolean> authenticate(JSONObject data) {
        DataResult<Config> dataResult = configService.find("ldap.setting.configure");
        if (!dataResult.getSuccess()) {
            return DataResult.error("", "Empty Ldap Setting");
        }

        EqualsFilter filter = new EqualsFilter("sAMAccountName", data.getString("username"));
        boolean authenticate = LdapUtils.template(dataResult.getData().getContent())
                .authenticate("", filter.toString(), data.getString("password"));
        return DataResult.of(authenticate);
    }


}
