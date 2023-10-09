package ai.chat2db.server.start.controller.ldap;

import ai.chat2db.server.domain.api.model.Config;
import ai.chat2db.server.domain.api.service.ConfigService;
import ai.chat2db.server.start.config.util.LdapUtils;
import ai.chat2db.server.tools.base.wrapper.result.DataResult;
import com.alibaba.fastjson2.JSONObject;
import jakarta.annotation.Resource;
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
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import java.util.Arrays;
import java.util.List;

import static org.springframework.ldap.query.LdapQueryBuilder.query;

@RestController
@RequestMapping("/api/ldap")
@Slf4j
public class LdapController {

    @Resource
    private ConfigService configService;

    @Value("${chat2db.ldap.debug:false}")
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
                        object.put("email", getAttr(attrs, "userPrincipalName"));
                        object.put("nickName", getAttr(attrs, "name"));
                        object.put("userName", getAttr(attrs, "sAMAccountName"));
                        return object;
                    }
                });

        return DataResult.of(result);
    }

    private Object getAttr(Attributes attrs, String id) throws NamingException {
        Attribute attr = attrs.get(id);
        if (attr == null) {
            return null;
        }

        return attr.get();
    }

}
