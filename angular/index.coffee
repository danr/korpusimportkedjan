window.Ctrl3 = ($scope) ->
    $scope.title = 'le nu binxo'
    $scope.text = 'ma tavla fi ma'

angular.module('zippyModule', [])
    .directive 'zippy', ->
        restrict: 'C'
        replace: true
        transclude: true
        scrope:
            title: '@zippyTitle'
        template: '''
            <div>
                <div class="title">{{title}}</div>
                <div class="body" ng-transclude>
                    Title: <input ng-model="title"><br>
                    Text: <textarea ng-model="text"></textarea>
                    <hr>
                    {{text}}
                </div>
            </div>'''
        link: (scope, element, attrs) ->
            title = angular.element element.children()[0]
            opened = true
            toggle = ->
                opened = !opened
                element.removeClass if opened then 'closed' else 'opened'
                element.addClass if !opened then 'closed' else 'opened'
                return
            title.bind 'click', toggle
            toggle()
