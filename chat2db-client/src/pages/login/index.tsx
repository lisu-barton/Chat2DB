import React, { useState } from 'react';
import { Button, Form, Input, Tooltip } from 'antd';
import { getUser, userLogin } from '@/service/user';
import { history } from 'umi';
import LogoImg from '@/assets/logo/logo.png';
import styles from './index.less';
import Setting from '@/blocks/Setting';
import Iconfont from '@/components/Iconfont';
import i18n from '@/i18n';
import { useNavigate } from 'react-router-dom';

interface IFormData {
  userName: string;
  password: string;
}

const App: React.FC = () => {
  const navigate = useNavigate();
  const handleLogin = async (formData: { userName: string; password: string }) => {
    let res = await userLogin(formData);
    if (res) {
      navigate('/');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.logo}>
        <img className={styles.logoImage} src={LogoImg} />
        <div className={styles.logoText}>Chat2DB</div>
      </div>
      <div className={styles.loginPlane}>
        <div className={styles.loginWelcome}>{i18n('login.text.welcome')}</div>
        <Tooltip
          placement="right"
          color={window._AppThemePack.colorBgBase}
          title={
            <div style={{ color: window._AppThemePack.colorText, opacity: 0.8, padding: '8px 4px' }}>
              {i18n('login.text.tips')}
            </div>
          }
        >
          {/* <div className={styles.whyLogin}>{i18n('login.text.tips.title')}</div> */}
        </Tooltip>

        <Form className={styles.loginForm} size="large" onFinish={handleLogin}>
          <Form.Item
            className={styles.loginFormItem}
            name="userName"
            rules={[{ required: true, message: i18n('login.form.user.placeholder') }]}
          >
            <Input autoComplete="off" placeholder={i18n('login.form.user')} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: i18n('login.form.password.placeholder') }]}>
            <Input.Password placeholder={i18n('login.form.password')} />
          </Form.Item>
          <div className={styles.defaultPasswordTips}>{i18n('login.tips.defaultPassword')}</div>
          <Button type="primary" htmlType="submit" className={styles.loginFormSubmit}>
            {i18n('login.button.login')}
          </Button>
        </Form>
      </div>

      <Setting
        className={styles.setting}
        render={
          <Button
            type="text"
            icon={<Iconfont style={{ fontSize: '14px' }} code="&#xe630;" />}
            className={styles.settingBtn}
          >
            {i18n('login.text.setting')}
          </Button>
        }
      />
    </div>
  );
};

export default App;
