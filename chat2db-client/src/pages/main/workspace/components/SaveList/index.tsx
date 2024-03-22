import React, { memo, useState, useEffect, useRef, useContext, useMemo } from 'react';
import classnames from 'classnames';
import i18n from '@/i18n';
import { connect } from 'umi';
import { Cascader, Divider, Input, Dropdown, Button, Spin } from 'antd';
import Iconfont from '@/components/Iconfont';
import LoadingContent from '@/components/Loading/LoadingContent';
import { IConnectionModelType } from '@/models/connection';
import { IWorkspaceModelType } from '@/models/workspace';
import historyServer from '@/service/history';
import { ConsoleStatus, ConsoleOpenedStatus } from '@/constants';
import { IConsole, ITreeNode } from '@/typings';
import styles from './index.less';
import { approximateList } from '@/utils';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';

interface IProps {
  className?: string;
  workspaceModel: IWorkspaceModelType['state'],
  dispatch: any;
  tableLoading: boolean;
  databaseLoading: boolean;
}

interface IOption {
  value: number;
  label: string;
  getUrl: string;
  setUrl: string;
}
const optionsList: IOption[] = [
  { value: 1, label: i18n('workspace.title.history'), getUrl: 'workspace/fetchGetHistoryConsole', setUrl: 'workspace/setHistoryList' },
  { value: 2, label: i18n('workspace.title.saved'), getUrl: 'workspace/fetchGetSavedConsole', setUrl: 'workspace/setConsoleList' },
]

const dvaModel = connect(
  ({ connection, workspace, loading }: { connection: IConnectionModelType; workspace: IWorkspaceModelType, loading: any }) => ({
    connectionModel: connection,
    workspaceModel: workspace,
    tableLoading: loading.effects['workspace/fetchGetCurTableList'],
    databaseLoading: loading.effects['workspace/fetchDatabaseAndSchema'],
  }),
);

const SaveList = dvaModel(function (props: any) {
  const [optionType, setOptionType] = useState<IOption>(optionsList[0]);
  const { workspaceModel, dispatch } = props;
  const { curWorkspaceParams, consoleList, historyList } = workspaceModel;
  const [searching, setSearching] = useState<boolean>(false);
  const inputRef = useRef<any>();
  const [searchedList, setSearchedList] = useState<ITreeNode[] | undefined>();

  useUpdateEffect(() => {
    getList();
  }, [optionType]);

  useEffect(() => {
    getList();
  }, [curWorkspaceParams]);

  function getList() {
    if (!curWorkspaceParams.dataSourceId || !(curWorkspaceParams?.databaseName || curWorkspaceParams?.schemaName)) {
      return
    }
    dispatch({
      type: optionType.getUrl,
      payload: {
        pageNo: 1,
        pageSize: 999,
        orderByDesc: false,
        status: ConsoleStatus.RELEASE,
        ...curWorkspaceParams,
      },
      callback: (res: any) => {
        dispatch({
          type: optionType.setUrl,
          payload: res.data,
        })
      }
    });
  }

  useEffect(() => {
    if (searching) {
      inputRef.current!.focus({
        cursor: 'start',
      });
    }
  }, [searching])


  function openSearch() {
    setSearching(true);
  }

  function onBlur() {
    if (!inputRef.current.input.value) {
      setSearching(false);
      setSearchedList(undefined);
    }
  }

  function onChange(value: string) {
    setSearchedList(approximateList(consoleList, value,))
  }

  function openConsole(data: IConsole) {

    if (optionType.value == 1) {
      dispatch({
        type: 'workspace/setCurHistoryDdl',
        payload: data.name,
      })

      return
    }


    let p: any = {
      id: data.id,
      tabOpened: ConsoleOpenedStatus.IS_OPEN
    };
    historyServer.updateSavedConsole(p).then((res) => {

      dispatch({
        type: 'workspace/setCurConsoleId',
        payload: data.id,
      });

      dispatch({
        type: optionType.getUrl,
        payload: {
          orderByDesc: false,
          tabOpened: ConsoleOpenedStatus.IS_OPEN,
          ...curWorkspaceParams
        },
        callback: (res: any) => {
          dispatch({
            type: optionType.setUrl,
            payload: res.data,
          })
        }
      })
    });
  }

  function deleteSaved(data: IConsole) {
    let p: any = {
      id: data.id,
    };
    historyServer.deleteSavedConsole(p).then((res) => {
      dispatch({
        type: optionType.getUrl,
        payload: {
          orderByDesc: true,
          tabOpened: ConsoleOpenedStatus.IS_OPEN,
          ...curWorkspaceParams
        },
        callback: (res: any) => {
          dispatch({
            type: 'workspace/setOpenConsoleList',
            payload: res.data,
          })
        }
      })
      dispatch({
        type: optionType.getUrl,
        payload: {
          orderByDesc: true,
          status: ConsoleStatus.RELEASE,
          ...curWorkspaceParams
        },
        callback: (res: any) => {
          dispatch({
            type: optionType.setUrl,
            payload: res.data,
          })
        }
      })
    });
  }

  function cascaderChange(value: string[], selectedOptions: IOption[]) {
    setOptionType(selectedOptions[0]);
  }

  return (
    <div className={styles.saveModule}>
      <div className={styles.leftModuleTitle}>
        {
          searching ?
            <div className={styles.leftModuleTitleSearch}>
              <Input
                ref={inputRef}
                size="small"
                placeholder={i18n('common.text.search')}
                prefix={<Iconfont code="&#xe600;" />}
                onBlur={onBlur}
                onChange={(e) => onChange(e.target.value)}
                allowClear
              />
            </div>
            :
            <div className={styles.leftModuleTitleText}>
              <Cascader
                defaultValue={[optionType.value]}
                popupClassName={styles.cascaderPopup}
                options={optionsList}
                onChange={cascaderChange as any}
              >
                <div className={styles.modelName}>
                  {optionType.label}
                  <Iconfont code='&#xe88e;' />
                </div>
              </Cascader>
              {/* <div className={styles.modelName}>{i18n('workspace.title.saved')}</div> */}
              <div className={styles.iconBox} >
                <div className={styles.refreshIcon} onClick={() => getList()}>
                    <Iconfont code="&#xec08;" />
                  </div>
                <div className={styles.iconBox} >
                  {/* <div className={styles.refreshIcon} onClick={() => refreshTableList()}>
                    <Iconfont code="&#xec08;" />
                  </div> */}
                  <div className={styles.searchIcon} onClick={() => openSearch()}>
                    <Iconfont code="&#xe600;" />
                  </div>
                </div>
              </div>
            </div>
        }
      </div>
      <div className={styles.saveBoxList}>
        <LoadingContent data={optionType.value==1 ? historyList : consoleList} handleEmpty>
          {(searchedList || (optionType.value==1 ? historyList : consoleList))?.map((t: IConsole) => {
            return (
              <div
                onDoubleClick={() => {
                  openConsole(t)
                }}
                key={t.id}
                className={styles.saveItem}
              >
                <div className={styles.saveItemText}>
                  <span dangerouslySetInnerHTML={{ __html: t.name }} />
                </div>
                  {
                    optionType.value==1 ? '' :
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'open',
                            label: i18n('common.button.open'),
                            onClick: () => {
                              openConsole(t)
                            }
                          },
                          {
                            key: 'delete',
                            label: i18n('common.button.delete'),
                            onClick: () => {
                              deleteSaved(t)
                            },
                          },
                        ],
                      }}
                    >
                      <div className={styles.moreButton}>
                        <Iconfont code="&#xe601;"></Iconfont>
                      </div>
                    </Dropdown>
                    }
              </div>
            );
          })}
        </LoadingContent>
      </div >
    </div >
  );
});

export default dvaModel(SaveList);
