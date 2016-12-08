/// <reference path="angular.min.js" />
angular.module("mainApp", ['ngMaterial', 'ngCordova', 'ngRoute']).
factory("feedback", function ($rootScope, $http) {


    var key = "tC19K25M624DO4PXF1s9uwrZayQtbwP0";

    var ajax = {
        get: function (data) {
            return {
                params: data,
                headers: {
                    "key": key
                }
            }
        },
        post: function (data) {
            return {
                params: data,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    "key": key
                }
            }
        }
    };

    var post = function (url, data, event) {
        //не врубился как данные (картинки ти проч файлы) отправлять.
        //отправка пока через jquery

        $.ajax({
            url: url,
            method: "Post",
            contentType: false,
            processData: false,
            data: data,
            success: function (result) {

                event(result);

            }
        });
    };
    var $post = function (url, data, event, error) {
        //не разобрался как в ангуларе отправлять массивы.
        //использую временно jQuery


        $.ajax({
            url: url,
            method: "Post",
            data: data,
            error: error,
            headers: {key: key},
            success: function (result) {
                if (event != undefined) {
                    event(result);
                }
            },
            error: function (data) {
                var a = 1;
            }
        });
    };
    var postAngular = function (url, data, event) {
        var obj = JSON.stringify(data)
        $http.post(url, obj, ajax.post(data)).success(function (data) {
            if (event != undefined) {
                event(data);
            }
        })

    };

    var get = function (url, data, event) {
        var dataAjax = ajax.get(data);

        $http.get(url, dataAjax).then(function (response) {
            if (event != undefined) {
                event(response.data);
            }
        })
    };

    var url = "http://" + $rootScope.mainModel.url + "/client.php";

    var obj = {

        create: function (event) {
            var data = {
                name: $rootScope.mainModel.name,
                type: $rootScope.mainModel.type,
                date: new Date().toPHPString(),
                action: "create_training"
            };

            $post(url, data, event);
        },

        sendStatistic: function (data, event) {
            data.action = "statistic";
            $post(url, data, event);
        },

        addCoords: function (data, error) {
            var d = {
                action: "add_coord",
                coord: data
            };
            $post(url, d, event, error);

        },
        stop: function (data, event) {
            data.action = "stop_training";
            $post(url, data, event);
        }
    }

    return obj;
})
.config(function ($routeProvider) {

    var version = "0.0.1";
    $routeProvider.when("/main", {
        templateUrl: "views/main.tpl.html?v=" + version,
        controller: "mainController"
    }).
    when("/training", {
        templateUrl: "views/training.tpl.html?v=" + version,
        controller: "trainingController"
    }).otherwise({ redirectTo: '/main' });

}).
run(function ($rootScope, $location) {

    var url = localStorage.getItem("url") || "";
    $rootScope.mainModel = {
        url: url,
        name: "",
        type: "",
        id: 0,
        itStop: true
    };

    $rootScope.onChange = function () {
        localStorage.setItem("url", $rootScope.mainModel.url);
    }

    document.addEventListener('backbutton', function () {
        var path = $location.path();
        if (path == "/main") {
            navigator.app.exitApp();
        }
        else {
            if ($rootScope.mainModel.isStop) {
                window.history.back();
            } 
        }
    }, false);
}).
controller("mainController", function ($scope, $rootScope, $location, $timeout) {
    $rootScope.mainModel.name = "";

    var watchID = navigator.geolocation.watchPosition(function () {
        var a = 1;
    },undefined,{ enableHighAccuracy: true, timeout: 3000, maximumAge: 2000 });
    $scope.start = function () {
        if ($rootScope.mainModel.name == "") {
            return;
        }
        navigator.geolocation.clearWatch(watchID);
        $timeout(function () {
            $location.path("/training");
        }, 300);

    }
}).
controller("trainingController", function ($scope, $rootScope, feedback, $location) {

    
    var trainingModel = {
        result: {
            speed: "",
            distance: "",
            avgSpeed: "",
            avgPace: ""
        }
    }

    var phone = {
        //информация о телеофне и всевозможные действия с ним

        vibration: function (data) {
            /// <signature>
            ///   <summary>Вибрация телефона</summary>
            ///   <param name="data" type="array">Массив вибраций (вибрация/пауза)</param>
            /// </signature>
            navigator.vibrate(data);
        },

        dataTransferOn: function () {
            /// <signature>
            ///   <summary>Проверка на возможность обмена данными</summary>
            /// </signature>

            var networkState = navigator.connection.type;
            return networkState != Connection.NONE;
        },

        calculateDistance: function (lat1, lon1, lat2, lon2) {

            var R = 6371; // km
            var dLat = (lat2 - 51.202399).toRad();
            var dLon = (lon2 - parseFloat(-1.479645)).toRad();
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(51.202399.toRad()) * Math.cos(lat2.toRad()) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            return (d.toFixed(2) / 1000).toFixed(2);

        },
        distance: function (lat1, lon1, lat2, lon2) {
            var p = 0.017453292519943295;    // Math.PI / 180
            var c = Math.cos;
            var a = 0.5 - c((lat2 - lat1) * p) / 2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p)) / 2;

            return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
        }
    }

    // var sendTimerID = 0;
    var interval = 3000;
    var convertTime = function (value) {

        var sec = value.toFixed(0);
        var min = sec / 60;
        min = min - (min % 1);

        sec -= min * 60;

        var h = 0;
        if (min >= 60) {
            h = min / 60;
            h = h - (h % 1)
        }

        function format(value) {
            return ("" + value).length == 1 ? "0" + value : value;
        }

        return format(min) + ":" + format(sec);
    };

    var map = {
        watchId: "",

        gpsOn: true,

        geometry: new Array(),

        updateForm: false,

        coordBefore: { latitude: null, longitude: null, speed: 0 },
        //координаты последнего измерения
        coord: { latitude: null, longitude: null, speed: 0 },

        distanceBefore: 0,
        distance: 0,

        timerBefore: 0,
        timer: 0,
        timerID: 0,

        centerMap: true,
        centerInit: false,
        centerClick: false,

        pause: false,

        sendCoord: new Array(),
        sendStatistic: null,
        sendTimerID: 0,
        sendInterval: 5000,

        mapZoom: 14,

        watch: false,

        //приложение свернуто
        appPause: false,

        startWatch: function () {

            this.distance = 0;
            this.timer = 0;
            this.coordBefore.latitude = null;
            this.coordBefore.longitude = null;
            this.coord.latitude = null;
            this.coord.longitude = null;
            this.number = -1;

            this.watchID = navigator.geolocation.watchPosition(
                function (position) {

                    if (!map.watch) {
                        map.coordBefore.latitude = map.coord.latitude;
                        map.coordBefore.longitude = map.coord.longitude;
                        map.coordBefore.speed = map.coord.speed;

                        map.coord.latitude = position.coords.latitude;
                        map.coord.longitude = position.coords.longitude;
                        map.coord.speed = position.coords.speed * 1.60934;
                    }


                    if (map.updateForm) {

                        //пауза может быть вызвана двумя кнопка Пауза и Остановить
                        if (!map.pause) {

                            var addCoord = true; //добавляем ВСЕ координаты
                            //если координаты не равны предыдущим данным, то добавляем в геометрию
                            //if (map.coord.latitude != map.coordBefore.latitude &&
                            //        map.coord.longitude != map.coordBefore.longitude) {
                            //    map.geometry.push([map.coord.latitude, map.coord.longitude]);
                            //    addCoord = true;
                            //}


                            //map.geometry.push([map.coord.latitude, map.coord.longitude]);
                            map.number++;
                            if (map.coordBefore.latitude != null) {

                                var dist = phone.distance(
                                    map.coordBefore.latitude,
                                    map.coordBefore.longitude,
                                    map.coord.latitude,
                                    map.coord.longitude
                                    ) / 1;


                                //передаем id тренировки
                                var dataCoord = { latitude: map.coord.latitude, longitude: map.coordBefore.longitude, distance: dist, id: $rootScope.mainModel.id, number: map.number };

                                if (addCoord) {
                                    map.sendCoord.push(dataCoord);
                                }

                                //передаем id статистики для обновления
                                var dataStat = { id: $rootScope.mainModel.id }

                                map.distanceBefore = map.distance;
                                map.distance += dist;

                                dataStat.distance = map.distance.toFixed(2);


                                //отправим данные на сервер

                                dataStat.time = map.timer;
                                var time = map.timer - map.timerBefore;
                                var curSpeed = time > 0 ? dist * 3600 / time : 0;

                                //рассчитаем скорость, если недоступна
                                var speed = 0;
                                speed = (map.distance / (map.timer / 3600)).toFixed(2)

                                dataStat.avgSpeed = speed;


                                var avgPace = map.distance == 0 ? 0 : (map.timer / 60) / map.distance;
                                dataStat.avgPace = avgPace.toFixed(2);
                                dataStat.avgPace = convertTime(dataStat.avgPace * 60);

                                dataStat.speed = map.coord.speed == null ? 0 : map.coord.speed.toFixed(1);
                                dataStat.speed = (time > 0 ? dist * 3600 / time : 0).toFixed(1);


                                if (!map.appPause) {
                                    //обновим данные контроллера
                                    trainingModel.result.speed = dataStat.speed;
                                    trainingModel.result.distance = dataStat.distance;
                                    trainingModel.result.avgSpeed = speed;
                                    trainingModel.result.avgPace = dataStat.avgPace;
                                }


                                map.sendStatistic = dataStat;
                            }
                            map.timerBefore = map.timer;
                        }

                    }

                    map.gpsOn = true;
                },
                    function () {
                        map.gpsOn = false;
                    },
                { enableHighAccuracy: true, timeout: 3000, maximumAge: 2000 }
            );
        },
        stopWatch: function () {
            navigator.geolocation.clearWatch(this.watchID);

            clearInterval(this.timerID);
            this.timerID = 0;
        },
        server: {
            send: function () {
                if (phone.dataTransferOn()) {

                    if (map.sendStatistic != null) {
                        feedback.sendStatistic(map.sendStatistic);
                        // sFr.ajax.disableError = true;
                        //$.ajax(sFr.ajax.ajaxData(m.params.url.server("SetStatistic"), map.sendStatistic, "POST"));
                        map.sendStatistic = null;
                    }

                    if (map.sendCoord.length > 0) {
                        //     sFr.ajax.disableError = true;

                        var cash = map.sendCoord;
                        feedback.addCoords(map.sendCoord,
                            function () {

                                //не удалось отправить.
                                //отправим в следующий раз
                                for (var i = 0; i < cash.length; i++) {
                                    var item = cash[i];
                                    map.sendCoord.push(item);
                                }

                                //map.sendCoord = cash;
                            });
                        //   var data = sFr.ajax.ajaxData(m.params.url.server("AddCoord"), { list: map.sendCoord }, "POST");

                        //data.error = 
                        //  $.ajax(data);
                        map.sendCoord = new Array();
                    }
                }
            },

            start: function () {
                map.sendTimerID = setInterval(this.send, map.sendInterval);
            },
            stop: function () {
                clearInterval(map.sendTimerID);
                this.send();

                map.sendTimerID = 0;
            }
        },
    };
    var timerMain = 0;

    feedback.create(function (data) {

        $rootScope.mainModel.itStop = false;

        $rootScope.mainModel.id = data;
        map.updateForm = true;
        map.startWatch();
        map.server.start();
        timerMain = setInterval(function () { map.timer++ }, 1000);

        $scope.$apply();

    })

    $scope.stop = function () {
        feedback.stop({
            id: $rootScope.mainModel.id,
            date: new Date().toPHPString()
        }, function () {
            $rootScope.mainModel.itStop = true;
            map.stopWatch();
            map.server.stop();

            clearInterval(timerMain);
            $scope.$apply();
        })
        

        
    }

    $scope.back = function () {
        $location.path("/main");
    }
    

});


Date.prototype.toPHPString = function () {

    return z(this.getDate()) + "." + z(this.getMonth() + 1) + "." + this.getFullYear() + " " +
        z(this.getHours()) + ":" + z(this.getMinutes()) + ":" + z(this.getSeconds());
}

function z(val) {
    val = "" + val;

    return (val.length === 1 ? "0" : "") + val;
}

Date.prototype.toAppString = function () {

    return z(this.getDate()) + "." + z(this.getMonth() + 1) + "." + this.getFullYear();
}
Date.prototype.begin = function () {

    return new Date(this.getFullYear(), this.getMonth(), 1);
}
Date.prototype.end = function () {
    return new Date(this.getFullYear(), this.getMonth() + 1, 0)
}