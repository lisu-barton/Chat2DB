import { createUser, deleteUser, getUserManagementList, getLdapUserManagementList, updateUser } from '@/service/team';
import { Button, Form, Input, Select, Modal, Popconfirm, Radio, Table, Tag, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import styles from './index.less';
import { AffiliationType, IUserVO, RoleType, StatusType, AccountType, ILdapUserVO } from '@/typings/team';
import i18n from '@/i18n';
import UniversalDrawer from '../universal-drawer';

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
  colon: false,
};

const requireRule = { required: true, message: i18n('common.form.error.required') };

function UserManagement() {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<IUserVO[]>([]);
  const [ldapSource, setLdapSource] = useState<ILdapUserVO[]>([]);
  const [pagination, setPagination] = useState({
    searchKey: '',
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['5', '10', '20', '30', '100'],
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLdapModalVisible, setIsLdapModalVisible] = useState(false);
  const [drawerInfo, setDrawerInfo] = useState<{ open: boolean; type?: AffiliationType; id?: number }>({
    open: false,
  })

  const columns = useMemo(
    () => [
      {
        title: i18n('team.user.userName'),
        dataIndex: 'userName',
        key: 'userName',
      },
      {
        title: i18n('team.user.nickName'),
        dataIndex: 'nickName',
        key: 'nickName',
      },
      {
        title: i18n('team.user.addForm.email'),
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: i18n('team.user.status'),
        dataIndex: 'status',
        key: 'status',
        render: (status: StatusType) => <Tag color={status === StatusType.VALID ? 'green' : 'red'}>{status}</Tag>,
      },
      {
        title: i18n('team.user.accountType'),
        dataIndex: 'accountType',
        key: 'accountType',
        render: (accountType: AccountType) => <Tag color={accountType === AccountType.NORMAL ? 'green' : 'yellow'}>{accountType}</Tag>,
      },
      {
        title: i18n('common.text.action'),
        key: 'action',
        width: 260,
        render: (_: any, record: IUserVO) => (
          <>
            <Button type='link' onClick={() => {
              handleEdit(record)
            }}>
              {i18n('common.button.edit')}
            </Button>
            <Button type='link' onClick={() => {
              setDrawerInfo({
                ...drawerInfo,
                open: true,
                type: AffiliationType.USER_TEAM,
                id: record.id,
              })
            }}>
              {i18n('team.action.affiliation.team')}
            </Button>
            <Button type='link' onClick={() => {
              setDrawerInfo({
                ...drawerInfo,
                open: true,
                type: AffiliationType.USER_DATASOURCE,
                id: record.id,
              })
            }}>
              {i18n('team.action.affiliation.datasource')}
            </Button>
            <Popconfirm
              title={i18n('common.tips.delete.confirm')}
              onConfirm={() => handleDelete(record.id)}
              okText={i18n('common.button.affirm')}
              cancelText={i18n('common.button.cancel')}
            >
              <a href="#" onClick={(e) => e.preventDefault()}>
                {i18n('common.button.delete')}
              </a>
            </Popconfirm>
          </>
        ),
      },
    ],
    [],
  );

  useEffect(() => {
    queryUserList();
    queryLdapUserList();
  }, [pagination.current, pagination.pageSize, pagination.searchKey]);

  const queryUserList = async () => {
    const { searchKey, current: pageNo, pageSize } = pagination;
    let res = await getUserManagementList({ searchKey, pageNo, pageSize });
    if (res) {
      setPagination({
        ...pagination,
        current: res.pageNo,
        pageSize: res.pageSize,
        total: res.total,
      });
      setDataSource(res?.data ?? []);
    }
  };

  const queryLdapUserList = async () => {
    let res = await getLdapUserManagementList({});
    if (res) {
      setLdapSource(res);
    }
  };

  const handleTableChange = (p: any) => {
    setPagination({
      ...pagination,
      ...p,
    });
  };

  const handleSearch = (searchKey: string) => {
    setPagination({
      ...pagination,
      searchKey,
    });
  };

  const handleCreateOrUpdateUser = async (userInfo: IUserVO) => {
    const requestApi = userInfo?.id ? updateUser : createUser;
    let res = await requestApi(userInfo);
    if (res) {
      queryUserList();
    }
  };

  const handleEdit = (record: IUserVO) => {
    form.setFieldsValue(record)
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    await deleteUser({ id })
    message.success(i18n('common.text.successfullyDelete'))
    queryUserList()
  }

  const isEditing = useMemo(() => {
    return form.getFieldValue('id') !== undefined;
  }, [form.getFieldValue('id')])

  const handleUserNameChange = (value: string) => {
    console.log('handleUserNameChange:', value);
    let data = ldapSource.find(it=> it.userName == value);
    if (!data) {
      return;
    }

    form.setFieldsValue(data);
  };
  
  // Filter `option.label` match the user type `input`
  const filterUserNameOption = (input: string, option?: { children: string; key: string }) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());
  
  console.log('form', form.getFieldsValue(true))
  return (
    <div>
      <div className={styles.tableTop}>
        <Input.Search
          maxLength={50}
          style={{ width: '320px' }}
          placeholder={i18n('team.input.search.placeholder')}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />
        <div>
          <Button type="primary" style={{ marginRight: '10px' }} icon={<PlusOutlined />} onClick={() => {
            form.resetFields();
            setIsModalVisible(true)
          }}>
            {i18n('team.action.addUser')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            form.resetFields();
            setIsLdapModalVisible(true)
          }}>
            {i18n('team.action.addLdapUser')}
          </Button>
        </div>
      </div>
      <Table
        rowKey={'id'}
        dataSource={dataSource}
        columns={columns}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={isEditing ? i18n('team.action.editUser') : i18n('team.action.addUser')}
        open={isModalVisible}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              const formValues = form.getFieldsValue(true);
              handleCreateOrUpdateUser(formValues);
              setIsModalVisible(false);
              form.resetFields();
            })
            .catch((errorInfo) => {
              form.scrollToField(errorInfo.errorFields[0].name);
              form.setFields(errorInfo.errorFields);
            })
            .finally(() => {
              form.resetFields();
            })
        }}
        onCancel={() => {
          form.resetFields();
          setIsModalVisible(false);
        }}
      >
        <Form
          {...formItemLayout}
          form={form}
          autoComplete={'off'}
          initialValues={{
            accountType: AccountType.NORMAL,
            roleCode: RoleType.USER,
            status: StatusType.VALID,
          }}
        >
          <Form.Item label={i18n('team.user.addForm.userName')} name="userName" rules={[requireRule]}>
            <Input maxLength={50} showCount autoComplete='off' readOnly={isEditing && form.getFieldValue("accountType")==AccountType.LDAP}/>
          </Form.Item>
          <Form.Item label={i18n('team.user.addForm.nickName')} name="nickName" rules={[requireRule]}>
            <Input maxLength={100} showCount />
          </Form.Item>
          <Form.Item label={i18n('team.user.addForm.email')} name="email" rules={[requireRule, {
            type: 'email',
            message: i18n('common.form.error.email')
          }]}>
            <Input autoComplete='off' />
          </Form.Item>
          {
            form.getFieldValue("accountType")==AccountType.LDAP ? "" : (
              <Form.Item label={i18n('team.user.addForm.password')} name="password" rules={[requireRule]}>
                <Input.Password maxLength={30} placeholder={isEditing ? '******' : ''} autoComplete='fake-password' />
              </Form.Item>
            )
          }
          <Form.Item label={i18n('team.user.addForm.roleCode')} name="roleCode" rules={[requireRule]}>
            <Radio.Group>
              <Radio value={RoleType.ADMIN}>{i18n('team.user.addForm.roleCode.admin')}</Radio>
              <Radio value={RoleType.USER}>{i18n('team.user.addForm.roleCode.user')}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label={i18n('team.user.addForm.status')} name="status" rules={[requireRule]}>
            <Radio.Group>
              <Radio value={StatusType.VALID}>{i18n('team.user.addForm.status.valid')}</Radio>
              <Radio value={StatusType.INVALID}>{i18n('team.user.addForm.status.invalid')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={i18n('team.action.addLdapUser')}
        open={isLdapModalVisible}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              const formValues = form.getFieldsValue(true);
              handleCreateOrUpdateUser(formValues);
              setIsLdapModalVisible(false);
              form.resetFields();
            })
            .catch((errorInfo) => {
              form.scrollToField(errorInfo.errorFields[0].name);
              form.setFields(errorInfo.errorFields);
            })
            .finally(() => {
              form.resetFields();
            })
        }}
        onCancel={() => {
          form.resetFields();
          setIsLdapModalVisible(false);
        }}
      >
        <Form
          {...formItemLayout}
          form={form}
          autoComplete={'off'}
          initialValues={{
            accountType: AccountType.LDAP,
            password: "****",
            roleCode: RoleType.USER,
            status: StatusType.VALID,
          }}
        >
          <Form.Item label={i18n('team.user.addForm.userName')} name="userName" rules={[requireRule]}>
            {/* <Input maxLength={50} autoComplete='off' /> */}
            <Select
              // mode="multiple"
              showSearch
              allowClear
              style={{ width: '100%' }}
              placeholder="Please select username"
              filterOption={filterUserNameOption}
              onChange={handleUserNameChange}
            >
              {ldapSource?.map((t) => (
                <Select.Option key={t.userName} value={t.userName}>
                {t.nickName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={i18n('team.user.addForm.roleCode')} name="roleCode" rules={[requireRule]}>
            <Radio.Group>
              <Radio value={RoleType.ADMIN}>{i18n('team.user.addForm.roleCode.admin')}</Radio>
              <Radio value={RoleType.USER}>{i18n('team.user.addForm.roleCode.user')}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label={i18n('team.user.addForm.status')} name="status" rules={[requireRule]}>
            <Radio.Group>
              <Radio value={StatusType.VALID}>{i18n('team.user.addForm.status.valid')}</Radio>
              <Radio value={StatusType.INVALID}>{i18n('team.user.addForm.status.invalid')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      <UniversalDrawer
        {...drawerInfo}
        byId={drawerInfo.id}
        onClose={() => {
          setDrawerInfo({
            ...drawerInfo,
            open: false
          })
        }}
      />
    </div>
  );
}

export default UserManagement;
