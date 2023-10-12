import React, { memo, useRef, useEffect, useMemo, useState } from 'react';
import { connect } from 'umi';
import lodash from 'lodash';
import styles from './index.less';
import DraggableContainer from '@/components/DraggableContainer';
import WorkspaceLeft from './components/WorkspaceLeft';
import WorkspaceRight from './components/WorkspaceRight';
import WorkspaceHeader from './components/WorkspaceHeader';
import { IConnectionModelType } from '@/models/connection';
import { IWorkspaceModelType } from '@/models/workspace';
import LoadingContent from '@/components/Loading/LoadingContent';
import { ConsoleOpenedStatus } from '@/constants';
import historyServer from '@/service/history';
import { IConsole } from '@/typings';

interface IProps {
  className?: string;
  workspaceModel: IWorkspaceModelType['state'];
  connectionModel: IConnectionModelType['state'];
  pageLoading: any;
  dispatch: any;
}

const dvaModel = connect(
  ({ connection, workspace, loading }: { connection: IConnectionModelType; workspace: IWorkspaceModelType, loading: any }) => ({
    connectionModel: connection,
    workspaceModel: workspace,
    pageLoading: loading.effects['workspace/fetchDatabaseAndSchemaLoading'] || loading.effects['workspace/fetchGetSavedConsoleLoading'],
  }),
);

interface Option {
  value: string;
  label: string;
  children?: Option[];
}

const workspace = memo<IProps>((props) => {
  const draggableRef = useRef<any>();
  const { workspaceModel, connectionModel, dispatch, pageLoading } = props;
  const { curConnection } = connectionModel;
  const { curWorkspaceParams, openConsoleList, curConsoleId } = workspaceModel;
  const [loading, setLoading] = useState(true);
  const isReady = curWorkspaceParams?.dataSourceId && ((curWorkspaceParams?.databaseName || curWorkspaceParams?.schemaName) || (curWorkspaceParams?.databaseName === null && curWorkspaceParams?.schemaName == null))
  const openConsoleListRef = useRef(openConsoleList);

  useEffect(() => {
    if (pageLoading === true) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [pageLoading])

  useEffect(() => {
    // 更新选中的Console信息
    console.log(curConnection?.alias);
    refreshOpenConsoleList();
  }, [curConnection]);

  useEffect(() => {
    if (isReady && !openConsoleList?.length) {
      console.log(curConnection?.alias)
      getConsoleList();
    }

    refreshOpenConsoleList();
  }, [curWorkspaceParams]);

  function refreshOpenConsoleList() {
    // 更新当前的Console为调整调整后
    const consoleId = curConsoleId || Number(localStorage.getItem('active-console-id') || 0);
    if (consoleId) {
      const activeConsole = openConsoleList?.find((t) => t.id === consoleId);
      if (activeConsole) {
        const payload: any = {
          dataSourceId: activeConsole.dataSourceId,
          dataSourceName: activeConsole.dataSourceName,
          databaseType: activeConsole.type,
          databaseName: activeConsole.databaseName,
          schemaName: activeConsole.schemaName,
        }

        if (lodash.isEqual(curWorkspaceParams, payload)) {
          return
        }
      
        let p: any = {
          ... activeConsole,
          type: curWorkspaceParams.databaseType,
          ... curWorkspaceParams,
        };

        historyServer.updateSavedConsole(p).then(()=>{
          // 更新新的数据
          const newList = openConsoleListRef.current?.map(t => {
            if (t.id === consoleId) {
              return p;
            }
            
            return t
          })
          dispatch({
            type: 'workspace/setOpenConsoleList',
            payload: newList,
          });
          
        })
      }
    }
  }

  function clearData() {
    dispatch(({
      type: 'workspace/setOpenConsoleList',
      payload: [],
    }))
    dispatch(({
      type: 'workspace/setConsoleList',
      payload: [],
    }))
    dispatch(({
      type: 'workspace/setDatabaseAndSchema',
      payload: undefined,
    }))
    dispatch(({
      type: 'workspace/setCurTableList',
      payload: [],
    }))
  }

  function getConsoleList() {
    let p: any = {
      pageNo: 1,
      pageSize: 999,
      tabOpened: ConsoleOpenedStatus.IS_OPEN,
      ...curWorkspaceParams,
    };

    dispatch({
      type: 'workspace/fetchGetSavedConsoleLoading',
      payload: p,
      callback: (res: any) => {
        dispatch({
          type: 'workspace/setOpenConsoleList',
          payload: res.data,
        });
      },
    });
  }

  return (
    <div className={styles.workspace}>
      <WorkspaceHeader></WorkspaceHeader>
      <LoadingContent className={styles.loadingContent} coverLoading={true} isLoading={loading}>
        <DraggableContainer className={styles.workspaceMain}>
          <div ref={draggableRef} className={styles.boxLeft}>
            <WorkspaceLeft />
          </div>
          <div className={styles.boxRight}>
            <WorkspaceRight />
          </div>
        </DraggableContainer>
      </LoadingContent >
    </div>
  );
});

export default dvaModel(workspace)