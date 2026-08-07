const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cwbDesktop', Object.freeze({
  chooseBackupFolder: () => ipcRenderer.invoke('desktop:choose-backup-folder'),
  saveBackup: (envelope, folder) => ipcRenderer.invoke('desktop:save-backup', envelope, folder),
  openBackup: () => ipcRenderer.invoke('desktop:open-backup'),
  openDataFolder: () => ipcRenderer.invoke('desktop:open-data-folder'),
  getVaultStatus: () => ipcRenderer.invoke('desktop:get-vault-status'),
  setBackupSecret: (secret) => ipcRenderer.invoke('desktop:set-backup-secret', secret),
  getBackupSecret: () => ipcRenderer.invoke('desktop:get-backup-secret'),
  pruneBackups: (folder, retain) => ipcRenderer.invoke('desktop:prune-backups', folder, retain),
  repositoryList: (collection) => ipcRenderer.invoke('desktop:repository-list', collection),
  repositoryGet: (collection, id) => ipcRenderer.invoke('desktop:repository-get', collection, id),
  repositoryPut: (collection, record) => ipcRenderer.invoke('desktop:repository-put', collection, record),
  repositoryPutMany: (collection, records) => ipcRenderer.invoke('desktop:repository-put-many', collection, records),
  repositoryReplaceManyAtomic: (collection, records) => ipcRenderer.invoke('desktop:repository-replace-many-atomic', collection, records),
  repositoryDelete: (collection, id) => ipcRenderer.invoke('desktop:repository-delete', collection, id),
  repositoryCount: (collection) => ipcRenderer.invoke('desktop:repository-count', collection),
  writeAttachment: (input) => ipcRenderer.invoke('desktop:write-attachment', input),
  readAttachment: (id) => ipcRenderer.invoke('desktop:read-attachment', id),
  deleteAttachment: (id) => ipcRenderer.invoke('desktop:delete-attachment', id),
  openExternal: (url) => ipcRenderer.invoke('desktop:open-external', url),
}));
