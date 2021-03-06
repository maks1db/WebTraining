// Основные сведения о пустом шаблоне см. в следующей документации:
// http://go.microsoft.com/fwlink/?LinkID=397705
// Для отладки кода при загрузке страницы в Ripple, а также на устройства или в эмуляторы Android запустите приложение, задайте точки останова, 
// , а затем запустите "window.location.reload()" в консоли JavaScript.
var WebTraining;
(function (WebTraining) {
    "use strict";
    var Application;
    (function (Application) {
        function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
        }
        Application.initialize = initialize;
        function onDeviceReady() {
            // Обработка событий приостановки и возобновления Cordova
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
            // TODO: Платформа Cordova загружена. Выполните здесь инициализацию, которая требуется Cordova.
            var parentElement = document.getElementById('deviceready');
            var listeningElement = parentElement.querySelector('.listening');
            var receivedElement = parentElement.querySelector('.received');
            listeningElement.setAttribute('style', 'display:none;');
            receivedElement.setAttribute('style', 'display:block;');
        }
        function onPause() {
            // TODO: Это приложение приостановлено. Сохраните здесь состояние приложения.
        }
        function onResume() {
            // TODO: Это приложение активировано повторно. Восстановите здесь состояние приложения.
        }
    })(Application = WebTraining.Application || (WebTraining.Application = {}));
    window.onload = function () {
        Application.initialize();
    };
})(WebTraining || (WebTraining = {}));
//# sourceMappingURL=appBundle.js.map