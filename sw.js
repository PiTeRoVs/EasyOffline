const cacheName = 'v1.0';
const idbVersion = "1";
var dbV
var forEach = function (collection, callback, scope) {
    if (Object.prototype.toString.call(collection) === '[object Object]') {
        for (var prop in collection) {
            if (Object.prototype.hasOwnProperty.call(collection, prop)) {
                callback.call(scope, collection[prop], prop, collection);
            }
        }
    } else {
        for (var i = 0, len = collection.length; i < len; i++) {
            callback.call(scope, collection[i], i, collection);
        }
    }
};
self.addEventListener('install', e => {
    self.skipWaiting();
});
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});
self.addEventListener('fetch', e => {
    if (e.request.clone().method === 'GET') {
        e.respondWith(
            caches.open(cacheName).then(cache => {
                return fetch(e.request).then(response => {
                    cache.put(e.request, response.clone());
                    return response;
                }).catch(() => caches.match(e.request));
            })
        );
    } else if (e.request.clone().method === 'POST') {
        e.respondWith(fetch(e.request.clone()).catch(function
            (error) {
            savePostRequests(e.request.clone().url, form_data)
        }))
    }

});
function openDatabase() {
    var indexedDBOpenRequest = indexedDB.open('postRequests', idbVersion);
    indexedDBOpenRequest.onerror = function (error) {
        console.error('IndexedDB error:', error)
    }
    indexedDBOpenRequest.onupgradeneeded = function () {
        this.result.createObjectStore('post_requests', {
            autoIncrement: true, keyPath: 'id'
        });
    }
    indexedDBOpenRequest.onsuccess = function () {
        dbV = this.result;
    }
}
openDatabase()
self.addEventListener('message', function (event) {
    if (event.data.hasOwnProperty('form_data')) {
        form_data = event.data.form_data;
    }
})
function getObjectStore(storeName, mode) {
    return dbV.transaction(storeName, mode
    ).objectStore(storeName)
}
function savePostRequests(url, payload) {
    var request = getObjectStore('post_requests', 'readwrite').add({
        url: url,
        payload: payload,
        method: 'POST'
    })
    request.onerror = function (error) {
        console.error(error)
    }
}
self.addEventListener('sync', function (event) {
    if (event.tag === 'sendFormData') {
        openDatabase();
        event.waitUntil(
            sendPostToServer()
        )
    }
})
function sendPostToServer() {
    var savedRequests = []
    var req = getObjectStore('post_requests').openCursor()
    req.onsuccess = async function (event) {
        var cursor = event.target.result
        if (cursor) {
            savedRequests.push(cursor.value)
            cursor.continue()
        } else {
            for (let savedRequest of savedRequests) {
                var requestUrl = savedRequest.url
                var payload = savedRequest.payload
                var body_content = '';
                forEach(payload, function (value, prop) {
                    body_content = body_content.concat(prop, '=', value, '&')
                });

                body_content = body_content.substring(0, body_content.length - 1);
                var method = savedRequest.method
                var headers = {
                    'Accept': '/*/',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
                fetch(requestUrl, {
                    headers: headers,
                    method: method,
                    body: body_content
                }).then(function (response) {
                    if (response.status < 400) {
                        getObjectStore('post_requests',
                            'readwrite').delete(savedRequest.id)
                    }
                }).catch(function (error) {
                    console.error('Send to Server failed:', error)
                    throw error
                })
            }
        }
    }
}