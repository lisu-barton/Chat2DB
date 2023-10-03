
ALTER TABLE `dbhub_user`
    ADD COLUMN `account_type` varchar(32) DEFAULT 'NORMAL' COMMENT '登陆类型';

update `dbhub_user`
set account_type = 'NORMAL'
where account_type is NULL;

