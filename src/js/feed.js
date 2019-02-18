var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var postTitle = document.querySelector('#title');
var postLocation = document.querySelector('#location');

function sendData(){
  fetch('https://pwagram-90958.firebaseio.com/posts.json', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      id: Date.toISOString,
      title: postTitle.value,
      location: postLocation.value,
      image: '"https://firebasestorage.googleapis.com/v0/b/pwagram-90958.appspot.com/o/north.jpg?alt=media&token=3f661d33-e401-499d-ac7c-3023e2ae1085"'
    })
  }).then(function(res){
    console.log('data sent successfully', res);

    console.log('test');
    var url = 'https://pwagram-90958.firebaseio.com/posts.json';
    var isNetworkDataRecieved = false;

    fetch(url)
      .then(function(res) {
        return res.json();
      })
      .then(function(data) {
        console.log('from feed web', data);
        isNetworkDataRecieved = true;
        var dataArray = [];
        for(var key in data) {
          if(data[key]) {
            dataArray.push(data[key]);
          }
        }
        updateFeed(dataArray);
      });

    if('indexedDB' in window) {
      readAllData('posts')
      .then(function(data){
        if(!isNetworkDataRecieved) {
          console.log('reading from IDB', data);
          updateFeed(data);
        }
      });
    }
  })
}

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards(){
  while(sharedMomentsArea.hasChildNodes()){
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateFeed(data) {
  clearCards();
  for(var i=0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var url = 'https://pwagram-90958.firebaseio.com/posts.json';
var isNetworkDataRecieved = false;

  fetch(url)
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      console.log('from feed web', data);
      isNetworkDataRecieved = true;
      var dataArray = [];
      for(var key in data) {
        if(data[key]) {
          dataArray.push(data[key]);
        }
      }
      updateFeed(dataArray);
    });

if('indexedDB' in window) {
  readAllData('posts')
  .then(function(data){
    if(!isNetworkDataRecieved) {
      console.log('reading from IDB', data);
      updateFeed(data);
    }
  });
}

form.addEventListener('submit', function(event) {
  
  event.preventDefault();

  if(postTitle.value.trim() === '' || postLocation.value.trim() === '') {
    alert('Please Enter Valid Data!');
    console.log('INVALID DAtA');
    return;
  }

  closeCreatePostModal();

  if('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
    .then(function(sw){
      var post = {
        id: new Date().toISOString(),
        title: postTitle.value,
        location: postLocation.value
      }
      writeData('sync-posts', post)
      .then(function(){
        console.log('sync register');
        sw.sync.register('new-post-request') .then(function(){
          console.log('hohoyi');
        });
      })
      .then(function(status){
        var snackbarContainer = document.querySelector('#confirmation-toast');
        var data = { message: 'your post was saved for syncing'};
        snackbarContainer.MaterialSnackbar.showSnackbar(data);   
      })
      .catch(function(err){
        console.log(err);
      });
    });
  } else {
    sendData();
  }
});