import React, { useEffect, useState } from 'react';
import configService from '@/service/config';
import { Alert, Button, Input, Radio, Spin } from 'antd';
import i18n from '@/i18n';
import classnames from 'classnames';
import { LdapConfig } from '@/typings/ldap';
import styles from './index.less';
import { getUser } from '@/service/user';
import { ILoginUser, IRole } from '@/typings/user';

// ldap 的设置项
export default function LdapSetting() {
  const [ldapConfig, setLdapConfig] = useState<LdapConfig>();
  const [userInfo, setUserInfo] = useState<ILoginUser>();
  const [loading, setLoading] = useState(true);
  
  const queryUserInfo = async () => {
    setLoading(true);
    try {
      const res = await getUser();
      setUserInfo(res);

           // 查询对应Ldap配置
      const config = await configService.getSystemConfig({code: "ldap.setting.configure"});
      let ldap = config ? JSON.parse(config.content) : {}
      setLdapConfig(ldap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queryUserInfo();
  }, []);


  if (!userInfo) {
    return <Alert description={i18n('setting.ldap.tips')} type="warning" showIcon />;
  }

  if (userInfo?.roleCode === IRole.USER) {
    // 如果是用户，不能配置ai
    return <Alert description={i18n('setting.ldap.user.hidden')} type="warning" showIcon />;
  }

  /** 应用Ai配置 */
  const handleApplyLdapConfig = () => {
    const newLdapConfig = { ...ldapConfig };
    if (newLdapConfig.urls && !newLdapConfig.urls?.startsWith('ldap://')) {
      newLdapConfig.urls = 'ldap://' + newLdapConfig.urls;
    }

    configService.setSystemConfig({code: "ldap.setting.configure", content: JSON.stringify(newLdapConfig)});
    
  };

  return (
    <Spin spinning={loading}>
      <div>
        <div className={styles.title}>Urls</div>
        <div className={classnames(styles.content, styles.chatGPTKey)}>
          <Input
            placeholder={i18n('setting.placeholder.ldap.urls')}
            value={ldapConfig?.urls}
            onChange={(e) => {
              setLdapConfig({ ...ldapConfig, urls: e.target.value });
            }}
          />
        </div>
        <div className={styles.title}>BaseDn</div>
        <div className={classnames(styles.content, styles.chatGPTKey)}>
          <Input
            placeholder={i18n('setting.placeholder.ldap.baseDn')}
            value={ldapConfig?.baseDn}
            onChange={(e) => {
              setLdapConfig({ ...ldapConfig, baseDn: e.target.value });
            }}
          />
        </div>
        <div className={styles.title}>UaerName</div>
        <div className={classnames(styles.content, styles.chatGPTKey)}>
          <Input
            placeholder={i18n('setting.placeholder.ldap.username')}
            value={ldapConfig?.username}
            onChange={(e) => {
              setLdapConfig({
                ...ldapConfig,
                username: e.target.value,
              });
            }}
          />
        </div>
        <div className={styles.title}>Password</div>
        <div className={classnames(styles.content, styles.chatGPTKey)}>
          <Input.Password
            maxLength={30}
            placeholder={i18n('setting.placeholder.ldap.password')}
            value={ldapConfig?.password}
            onChange={(e) => {
              setLdapConfig({
                ...ldapConfig,
                password: e.target.value,
              });
            }}
          />
        </div>
      </div>

      <div className={styles.bottomButton}>
        <Button type="primary" onClick={handleApplyLdapConfig}>
          {i18n('setting.button.apply')}
        </Button>
      </div>

      {/* {aiConfig?.aiSqlSource === AiSqlSourceType.CHAT2DBAI && !aiConfig.apiKey && <Popularize source="setting" />} */}
    </Spin>
  );
}
