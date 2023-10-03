package ai.chat2db.server.admin.api.controller.user.request;

import ai.chat2db.server.domain.api.enums.AccountTypeEnum;
import ai.chat2db.server.domain.api.enums.RoleCodeEnum;
import ai.chat2db.server.domain.api.enums.ValidStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * create
 *@author Jiaju Zhuang
 */
@Data
public class UserCreateRequest {
    /**
     * 用户名
     */
    @NotNull
    private String userName;

    /**
     * 密码
     */
    @NotNull
    private String password;

    /**
     * 昵称
     */
    @NotNull
    private String nickName;

    /**
     * 邮箱
     */
    @NotNull
    private String email;


    /**
     * 角色编码
     *
     * @see RoleCodeEnum
     */
    @NotNull
    private String roleCode;

    /**
     * 用户状态
     *
     * @see ValidStatusEnum
     */
    @NotNull
    private String status;

    /**
     * 用户类型
     *
     * @see AccountTypeEnum
     */
    @NotNull
    private String accountType;
}
