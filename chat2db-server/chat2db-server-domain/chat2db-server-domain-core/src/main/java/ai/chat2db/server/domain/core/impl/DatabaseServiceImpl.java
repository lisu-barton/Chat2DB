package ai.chat2db.server.domain.core.impl;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;

import ai.chat2db.server.domain.api.param.DatabaseOperationParam;
import ai.chat2db.server.domain.api.param.DatabaseQueryAllParam;
import ai.chat2db.server.domain.api.param.MetaDataQueryParam;
import ai.chat2db.server.domain.api.param.SchemaOperationParam;
import ai.chat2db.server.domain.api.param.SchemaQueryParam;
import ai.chat2db.server.domain.api.service.DatabaseService;
import ai.chat2db.server.domain.core.cache.CacheManage;
import ai.chat2db.server.tools.base.wrapper.result.ActionResult;
import ai.chat2db.server.tools.base.wrapper.result.DataResult;
import ai.chat2db.server.tools.base.wrapper.result.ListResult;
import ai.chat2db.spi.MetaData;
import ai.chat2db.spi.model.Database;
import ai.chat2db.spi.model.MetaSchema;
import ai.chat2db.spi.model.Schema;
import ai.chat2db.spi.sql.Chat2DBContext;
import cn.hutool.core.thread.ThreadUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import static ai.chat2db.server.domain.core.cache.CacheKey.getDataBasesKey;
import static ai.chat2db.server.domain.core.cache.CacheKey.getDataSourceKey;
import static ai.chat2db.server.domain.core.cache.CacheKey.getSchemasKey;

/**
 * @author moji
 * @version DataSourceCoreServiceImpl.java, v 0.1 2022年09月23日 15:51 moji Exp $
 * @date 2022/09/23
 */
@Slf4j
@Service
public class DatabaseServiceImpl implements DatabaseService {

    @Override
    public ListResult<Database> queryAll(DatabaseQueryAllParam param) {
        List<Database> databases = CacheManage.getList(getDataBasesKey(param.getDataSourceId()), Database.class,
            (key) -> param.isRefresh(),
            (key) -> getDatabases(param.getDbType(), param.getConnection() == null ? Chat2DBContext.getConnection()
                : param.getConnection())
        );
        return ListResult.of(databases);
    }

    private List<Database> getDatabases(String dbType, Connection connection) {
        MetaData metaData = Chat2DBContext.getMetaData(dbType);
        List<Database> databases = metaData.databases(connection);
        sortDatabases(databases,connection);
        return databases;
    }

    private void sortDatabases(List<Database> databases,Connection connection) {
        if (CollectionUtils.isEmpty(databases)) {
            return;
        }
        String ulr = null;
        try {
            ulr = connection.getMetaData().getURL();
        } catch (SQLException e) {
            log.error("get url error", e);
        }
        // If the database name contains the name of the current database, the current database is placed in the first place
        int num = -1;
        for (int i = 0; i < databases.size(); i++) {
            if (StringUtils.isNotBlank(ulr) && ulr.contains(databases.get(i).getName())) {
                num = i;
                break;
            }
        }
        if (num != -1 && num != 0) {
            Collections.swap(databases, num, 0);
        }
    }

    @Override
    public ListResult<Schema> querySchema(SchemaQueryParam param) {
        List<Schema> schemas = CacheManage.getList(getSchemasKey(param.getDataSourceId(), param.getDataBaseName()),
            Schema.class,
            (key) -> param.isRefresh(), (key) -> {
                Connection connection = param.getConnection() == null ? Chat2DBContext.getConnection()
                    : param.getConnection();
                MetaData metaData = Chat2DBContext.getMetaData();
                return metaData.schemas(connection, param.getDataBaseName());
            });
        return ListResult.of(schemas);
    }

    @Override
    public DataResult<MetaSchema> queryDatabaseSchema(MetaDataQueryParam param) {
        MetaSchema metaSchema = new MetaSchema();
        MetaData metaData = Chat2DBContext.getMetaData();
        MetaSchema ms = CacheManage.get(getDataSourceKey(param.getDataSourceId()), MetaSchema.class,
            (key) -> param.isRefresh(), (key) -> {
                Connection connection = Chat2DBContext.getConnection();
                List<Database> databases = metaData.databases(connection);
                if (!CollectionUtils.isEmpty(databases)) {
                    CountDownLatch countDownLatch = ThreadUtil.newCountDownLatch(databases.size());
                    for (Database database : databases) {
                        ThreadUtil.execute(() -> {
                            try {
                                database.setSchemas(metaData.schemas(connection, database.getName()));
                                countDownLatch.countDown();
                            } catch (Exception e) {
                                log.error("queryDatabaseSchema error", e);
                            }
                        });
                    }
                    try {
                        countDownLatch.await();
                    } catch (InterruptedException e) {
                        log.error("queryDatabaseSchema error", e);
                    }
                    metaSchema.setDatabases(databases);

                } else {
                    List<Schema> schemas = metaData.schemas(connection, null);
                    metaSchema.setSchemas(schemas);
                }
                return metaSchema;
            });

        return DataResult.of(ms);
    }

    @Override
    public ActionResult deleteDatabase(DatabaseOperationParam param) {
        Chat2DBContext.getDBManage().dropDatabase(Chat2DBContext.getConnection(), param.getDatabaseName());
        return ActionResult.isSuccess();
    }

    @Override
    public ActionResult createDatabase(DatabaseOperationParam param) {
        Chat2DBContext.getDBManage().createDatabase(Chat2DBContext.getConnection(), param.getDatabaseName());
        return ActionResult.isSuccess();
    }

    @Override
    public ActionResult modifyDatabase(DatabaseOperationParam param) {
        Chat2DBContext.getDBManage().modifyDatabase(Chat2DBContext.getConnection(), param.getDatabaseName(),
            param.getNewDatabaseName());
        return ActionResult.isSuccess();
    }

    @Override
    public ActionResult deleteSchema(SchemaOperationParam param) {
        Chat2DBContext.getDBManage().dropSchema(Chat2DBContext.getConnection(), param.getDatabaseName(),
            param.getSchemaName());
        return ActionResult.isSuccess();
    }

    @Override
    public ActionResult createSchema(SchemaOperationParam param) {
        Chat2DBContext.getDBManage().createSchema(Chat2DBContext.getConnection(), param.getDatabaseName(),
            param.getSchemaName());
        return ActionResult.isSuccess();
    }

    @Override
    public ActionResult modifySchema(SchemaOperationParam param) {
        Chat2DBContext.getDBManage().modifySchema(Chat2DBContext.getConnection(), param.getDatabaseName(),
            param.getSchemaName(),
            param.getNewSchemaName());
        return ActionResult.isSuccess();
    }

}