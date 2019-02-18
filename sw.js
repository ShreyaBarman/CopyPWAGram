importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');
var STATIC_CACHE = 'static-v54';
var DYNAMIC_CACHE = 'dynamic-v4';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/idb.js',
  '/src/js/material.min.js',
  'src/css/app.css',
  'src/css/feed.css',
  '/src/images/main-image.jpg',
  '/src/images/sadPup.jpeg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// function trimCache(cacheName, maxSize) {
//   caches.open(cacheName)
//   .then(function(cache){
//     return cache.keys()
//     .then(function(key){
//       if(key.length > maxSize) {
//         cache.delete[key[0]]
//         .then(trimCache(cacheName, maxSize));
//       }
//     })
//   });
// }
function isInArray(value, array) {
  for(i=0; i< array.length; i++) {
    if(array[i] === value) {
      return true;
    }
  }
  return false;
}
self.addEventListener('install', function(event) {
  console.log('[service worker] service worker installing', event);
  event.waitUntil(
    caches.open(STATIC_CACHE)
    .then(function(cache) {
      cache.addAll(STATIC_FILES)
    })
  );
});
self.addEventListener('activate', function(event) {
  console.log('[service worker] service worker activating', event);
  event.waitUntil(
    caches.keys().
    then(function(keyList){
      return Promise.all(keyList.map(function(key){
        if(key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
          console.log('[Service Worker] Removing old cache' + key);
          return caches.delete(key);
        }
      }))
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var url = 'https://pwagram-90958.firebaseio.com/posts.json';
  if(event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
        .then(function(res){
          var clonedRes = res.clone();
          clearAllData('posts')
          .then(function(){
            return clonedRes.json();
          })
          .then(function(data){
            for(var key in data) {
              writeData('posts', data[key]);
            }
          });
          return res;
        })
    )
  // } else if(isInArray(event.request.url, STATIC_FILES)) {
  //   event.respondWith(
  //     caches.match(event.request.url)
  //   );
  } else {
    event.respondWith(
      caches.match(event.request)
      .then(function(response) {
        if(response) {
          return response;
        } else {
          return fetch(event.request)
          .then(function(res) {
            return caches.open(DYNAMIC_CACHE)
            .then(function(cache){
              //trimCache(DYNAMIC_CACHE, 6);
              cache.put(event.request.url, res.clone());
              return res;
            })
          })
          .catch(function(err){
            return caches.open(STATIC_CACHE)
            .then(function(cache){
              if(event.request.headers.get('accept').includes('text/html')) {
                return cache.match('/offline.html');
              } 
            });
          });
        }
      })
    );
  } 
});
// self.addEventListener('fetch', function(event){
//   event.respondWith(
//     caches.match(event.request)
//     .then(function(response) {
//       if(response) {
//         return response;
//       } else {
//         return fetch(event.request)
//         .then(function(res) {
//           return caches.open(DYNAMIC_CACHE)
//           .then(function(cache){
//             cache.put(event.request.url, res.clone());
//             return res;
//           })
//         })
//         .catch(function(err){
//           return caches.open(STATIC_CACHE)
//           .then(function(cache){
//             return cache.match('/offline.html');
//           });
//         });
//       }
//     })
//   );
// });

self.addEventListener('sync', function(event) {
  console.log('[service worker] BAckground Syncing', event);
  if(event.tag == 'new-post-request') {
    event.waitUntil(
      readAllData('sync-posts')
      .then(function(data) {
        for(var dt of data) {
          if(dt) {
            fetch('https://pwagram-90958.firebaseio.com/posts.json', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: '"https://firebasestorage.googleapis.com/v0/b/pwagram-90958.appspot.com/o/north.jpg?alt=media&token=3f661d33-e401-499d-ac7c-3023e2ae1085"'
              })
            }).then(function(res){
              console.log('[service worker] data sent successfully', res);
              if(res.ok) {
                deleteItemFromData('sync-posts', dt.id);
              }
            });
          }
        }
      })
    )
  }
})
