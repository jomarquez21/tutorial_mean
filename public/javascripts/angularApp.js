(function() {

  angular
    .module('myApp', ['ui.router'])
    .config(Config)
    .factory('posts', PostFactory)
    .factory('auth', AuthFactory)
    .controller('AuthCtrl', AuthCtrl)
    .controller('MainCtrl', MainCtrl)
    .controller('PostCtrl', PostCtrl)
    .controller('NavCtrl', NavCtrl);

  Config.$inject = ['$stateProvider', '$urlRouterProvider'];
  PostFactory.$inject = ['$http', 'auth'];
  AuthFactory.$inject = ['$http', '$window'];
  AuthCtrl.$inject = ['auth', '$state'];
  MainCtrl.$inject = ['posts', 'auth'];
  PostCtrl.$inject = ['posts', 'post', 'auth'];
  NavCtrl.$inject = ['auth'];

  function MainCtrl(posts, auth) {
    var self = this;

    this.title = '';
    this.link = '';

    this.posts = posts.posts;

    this.addPost = function() {
      if (!self.title || self.title === '') {
        return;
      }
      posts.create({
        title: self.title,
        link: self.link,
      });
      self.title = '';
      self.link = '';
    };

    this.incrementUpvotes = function(post) {
      posts.upvote(post);
    };

    this.isLoggedIn = auth.isLoggedIn;
  };

  function PostFactory($http, auth) {
    var o = {
      posts: []
    };
    o.getAll = function() {
      return $http.get('/posts').success(function(data) {
        angular.copy(data, o.posts);
      });
    }
    o.create = function(post) {
      return $http.post(
        '/posts', post, {
          headers: {
            Authorization: 'Bearer ' + auth.getToken()
          }
        }
      ).success(function(data) {
        o.posts.push(data);
      });
    };
    o.upvote = function(post) {
      return $http.put(
        '/posts/' + post._id + '/upvote', null, {
          headers: {
            Authorization: 'Bearer ' + auth.getToken()
          }
        }
      ).success(function(data) {
        post.upvotes += 1;
      });
    };
    o.get = function(id) {
      return $http.get('/posts/' + id).then(function(res) {
        return res.data;
      });
    };
    o.addComment = function(id, comment) {
      return $http.post(
        '/posts/' + id + '/comments', comment, {
          headers: {
            Authorization: 'Bearer ' + auth.getToken()
          }
        }
      );
    };
    o.upvoteComment = function(post, comment) {
      return $http.put(
        '/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
          headers: {
            Authorization: 'Bearer ' + auth.getToken()
          }
        }
      ).success(function(data) {
        comment.upvotes += 1;
      });
    };
    return o;
  };

  function AuthCtrl(auth, $state) {
    var self = this;
    this.user = {};

    this.register = function() {
      auth.register(self.user).error(function(error) {
        self.error = error;
      }).then(function() {
        $state.go('home');
      });
    };

    this.logIn = function() {
      auth.logIn(self.user).error(function(error) {
        self.error = error;
      }).then(function() {
        console.log('invitas');
        console.log($state);
        $state.go('home');
      });
    };
  };

  function PostCtrl(posts, post, auth) {
    var self = this;

    this.post = post;
    this.body = '';
    this.isLoggedIn = auth.isLoggedIn;

    this.addComment = function() {
      if (self.body === '') {
        return;
      }
      posts.addComment(post._id, {
        body: self.body,
        author: 'user'
      }).success(function(comment) {
        self.post.comments.push(comment);
      });
      self.body = '';
    };

    this.incrementUpvotes = function(comment) {
      // comment.upvotes += 1;
      posts.upvoteComment(post, comment);
    }
  };

  function NavCtrl(auth) {
    var self = this;
    this.isLoggedIn = auth.isLoggedIn;
    this.currentUser = auth.currentUser;
    this.logOut = auth.logOut;
  };

  function Config($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl as mc',
        resolve: {
          postPromise: ['posts', function(posts) {
            return posts.getAll();
          }]
        }
      })
      .state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostCtrl as pc',
        resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts) {
            return posts.get($stateParams.id);
          }]
        }
      })
      .state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthCtrl as LC',
        onEnter: ['$state', 'auth', function($state, auth) {
          if (auth.isLoggedIn()) {
            $state.go('home');
          }
        }]
      })
      .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthCtrl as AC',
        onEnter: ['$state', 'auth', function($state, auth) {
          if (auth.isLoggedIn()) {
            $state.go('home');
          }
        }]
      });
    $urlRouterProvider.otherwise('home');
  };

  function AuthFactory($http, $window) {
    var auth = {};
    auth.saveToken = function(token) {
      $window.localStorage['flapper-news-token'] = token;
    };
    auth.getToken = function() {
      return $window.localStorage['flapper-news-token'];
    };
    auth.isLoggedIn = function() {
      var token = auth.getToken();

      if (token) {
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };
    // nombre del usuario que ha iniciado session
    auth.currentUser = function() {
      if (auth.isLoggedIn()) {
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.username;
      }
    };
    auth.register = function(user) {
      return $http.post('/register', user).success(function(data) {
        auth.saveToken(data.token);
      });
    };
    auth.logIn = function(user) {
      return $http.post('/login', user).success(function(data) {
        auth.saveToken(data.token);
      });
    };
    auth.logOut = function() {
      $window.localStorage.removeItem('flapper-news-token');
    };
    return auth;
  };
})();