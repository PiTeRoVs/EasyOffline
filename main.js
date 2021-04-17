function initializePWA(manifest = "manifest.json", serviceWorker = "./sw.js", scope = { scope: './' }) {
    let manifestElem = document.createElement("link");
    manifestElem.rel = "manifest";
    manifestElem.href = manifest;
    manifestElem.crossorigin = "anonymous";
    document.getElementsByTagName("head")[0].appendChild(manifestElem);
    if(serviceWorker != "none"){
        if('serviceWorker' in navigator) {
            navigator.serviceWorker.register(serviceWorker, scope);
        }
        else{
            console.warn("%cThis browser does not support serviceWorker, PWA can "+ "%cNOT" + " %cbe installed.", "", "color:red;", "");
        }
    }
}
function removeServiceWorkder(serviceWorker = "./src/sw.js") {
    if(serviceWorker != "none"){
        if('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                 registration.unregister();
               } 
            });
        }
    }
}
class EasyIDB{
    openIDB(dbName) {
        let self = this;
        return new Promise((resolve, reject)=>{
            window.indexedDB.databases().then((e)=>{
                if(!e.find(element => element.name == dbName)){
                    reject("Database doesn't exist. Create it before using");
                }
                else{
                    let currentIDB = window.indexedDB.open(dbName);
                    currentIDB.onsuccess = (e)=>{
                        self.currentIDB = currentIDB; 
                        self.event = e;
                        resolve(self);
                    };
                    currentIDB.onupgradeneeded = (e)=>{
                        self.currentIDB = currentIDB; 
                        self.event = e;
                        resolve(self);
                    };
                    currentIDB.onerror = (e)=>{
                        self.currentIDB = undefined; 
                        self.event = undefined;
                        reject(self);
                    };
                }
            });
        });  
    }
    createIDB(dbName, dbStructure = [{name:"table", keyPath: "id", autoIncrement: true}]){
        let self = this;
        return new Promise((resolve, reject)=>{
            window.indexedDB.databases().then((e)=>{
                let currentIDB = window.indexedDB.open(dbName);
                currentIDB.onsuccess = (e)=>{
                    self.currentIDB = currentIDB; 
                    self.event = e;
                    resolve(self);
                };
                currentIDB.onupgradeneeded = (e)=>{
                    self.currentIDB = currentIDB; 
                    self.event = e;
                    dbStructure.forEach((element)=>{
                        currentIDB.result.createObjectStore(element.name, { keyPath: element.keyPath, autoIncrement: element.autoIncrement });  
                    });
                    resolve(self);
                };
                currentIDB.onerror = (e)=>{
                    self.currentIDB = undefined; 
                    self.event = undefined;
                    reject(self);
                };
            });
        });
    }
    readTable(tableName) {
        return new Promise((resolve, reject)=>{
            if(!this.currentIDB){
                reject();
                return;
            }
            else{
                let db = this.currentIDB.result;
                let objectStore = db.transaction(tableName).objectStore(tableName);
                objectStore.openCursor().onsuccess = function(event) {
                    let cursor = event.target.result;                    
                    if (cursor) {
                        console.log(cursor.value);
                        cursor.continue();
                    }
                };
            }           
        });  
    }
    pushValue(tableName, value, key = -1){
        return new Promise((resolve, reject)=>{
            if(!this.currentIDB){
                reject();
                return;
            }
            else{
                let db = this.currentIDB.result;
                let objectStore = db.transaction(tableName, "readwrite").objectStore(tableName);
                let objectStoreRequest;
                if(key == -1){
                    objectStoreRequest = objectStore.put(value);
                }
                else{
                    objectStoreRequest = objectStore.put(value, key);
                }
                objectStoreRequest.onsuccess = function () {
                    resolve();
                }
            }           
        });  
    }
    tableExists(tableName){
        return new Promise((resolve, reject)=>{
            if(!this.currentIDB){
                reject();
            }
            else{
                let db = this.currentIDB.result;
                Array.from(db.objectStoreNames).forEach((item)=>{
                    if(tableName == item){
                        resolve();
                    }
                });
                reject();
            }
           
        });

    }
    
}
