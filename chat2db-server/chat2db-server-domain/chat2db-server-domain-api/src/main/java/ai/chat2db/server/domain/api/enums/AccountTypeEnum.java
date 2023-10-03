package ai.chat2db.server.domain.api.enums;

import ai.chat2db.server.tools.base.enums.BaseEnum;
import lombok.Getter;

/**
 * account type
 *
 * @author Barton li
 */
@Getter
public enum AccountTypeEnum implements BaseEnum<String> {
    /**
     * normal
     */
    NORMAL("NORMAL"),

    /**
     * LDAP
     */
    LDAP("LDAP"),

    ;

    final String description;

    AccountTypeEnum(String description) {
        this.description = description;
    }

    @Override
    public String getCode() {
        return this.name();
    }

}
