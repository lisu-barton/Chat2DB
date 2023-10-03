package ai.chat2db.server.start.controller.oauth;

import ai.chat2db.server.domain.api.enums.AccountTypeEnum;
import ai.chat2db.server.domain.api.enums.RoleCodeEnum;
import ai.chat2db.server.domain.api.enums.ValidStatusEnum;
import ai.chat2db.server.domain.api.model.Config;
import ai.chat2db.server.domain.api.service.ConfigService;
import ai.chat2db.server.start.config.util.LdapUtils;
import com.alibaba.fastjson2.JSONObject;
import jakarta.annotation.Resource;

import ai.chat2db.server.domain.api.model.User;
import ai.chat2db.server.domain.api.service.UserService;
import ai.chat2db.server.start.controller.oauth.request.LoginRequest;
import ai.chat2db.server.tools.base.excption.BusinessException;
import ai.chat2db.server.tools.base.wrapper.result.ActionResult;
import ai.chat2db.server.tools.base.wrapper.result.DataResult;
import ai.chat2db.server.tools.common.model.LoginUser;
import ai.chat2db.server.tools.common.util.ContextUtils;

import cn.dev33.satoken.context.SaHolder;
import cn.dev33.satoken.stp.StpUtil;
import cn.dev33.satoken.util.SaTokenConsts;
import cn.hutool.crypto.digest.DigestUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 登录授权服务
 *
 * @author Jiaju Zhuang
 */
@RestController
@RequestMapping("/api/oauth")
@Slf4j
public class OauthController {

    @Resource
    private UserService userService;

    @Resource
    private ConfigService configService;

    /**
     * 用户名密码登录
     *
     * @param request
     * @return
     */
    @PostMapping("login_a")
    public DataResult login(@Validated @RequestBody LoginRequest request) {
        //   查询用户
        User user = userService.query(request.getUserName()).getData();
        if (user == null) {
            throw new BusinessException("oauth.userNameNotExits");
        }
        if (!ValidStatusEnum.VALID.getCode().equals(user.getStatus())) {
            throw new BusinessException("oauth.invalidUserName");
        }
        if (RoleCodeEnum.DESKTOP.getDefaultUserId().equals(user.getId())) {
            throw new BusinessException("oauth.IllegalUserName");
        }
        if (AccountTypeEnum.LDAP.getCode().equals(request.getAccountType())) {
            if (authenticate(request)) {
                return DataResult.of(doLogin(user));
            }

            throw new BusinessException("oauth.IllegalLdapUser");
        }

        // Successfully logged in without modifying the administrator password
        if (RoleCodeEnum.ADMIN.getDefaultUserId().equals(user.getId()) && RoleCodeEnum.ADMIN.getPassword().equals(
            user.getPassword())) {
            return DataResult.of(doLogin(user));
        }

        if (!DigestUtil.bcryptCheck(request.getPassword(), user.getPassword())) {
            throw new BusinessException("oauth.passwordIncorrect");
        }
        return DataResult.of(doLogin(user));
    }

    private Boolean authenticate(LoginRequest request) {
        DataResult<Config> dataResult = configService.find("ldap.setting.configure");
        if (!dataResult.getSuccess()) {
            return false;
        }

        EqualsFilter filter = new EqualsFilter("sAMAccountName", request.getUserName());
        return LdapUtils.template(dataResult.getData().getContent())
                .authenticate("", filter.toString(), request.getPassword());
    }


    private Object doLogin(User user) {
        StpUtil.login(user.getId());
        return SaHolder.getStorage().get(SaTokenConsts.JUST_CREATED_NOT_PREFIX);
    }

    /**
     * 登出
     *
     * @return
     */
    @PostMapping("logout_a")
    public ActionResult logout() {
        StpUtil.logout();
        return ActionResult.isSuccess();
    }

    /**
     * user
     *
     * @return
     */
    @GetMapping("user")
    public DataResult<LoginUser> user() {
        return DataResult.of(getLoginUser());
    }

    /**
     * user
     *
     * @return
     */
    @GetMapping("user_a")
    public DataResult<LoginUser> usera() {
        return DataResult.of(getLoginUser());
    }

    private LoginUser getLoginUser() {
        LoginUser loginUser = ContextUtils.queryLoginUser();
        if (loginUser == null) {
            return null;
        }
        if (RoleCodeEnum.DESKTOP.getCode().equals(loginUser.getRoleCode())) {
            return null;
        }
        return loginUser;
    }

}
