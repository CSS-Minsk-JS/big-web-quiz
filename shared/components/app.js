/**
*
* Copyright 2016 Google Inc. All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import {h, render} from 'preact';

import {Login, Logout} from './user';
import BoundComponent from './bound-component';
import Intro from './intro';
import TracksTabs from './tracks-tabs';
import QuestionWaiting from './question-waiting';
import LoginStatus from './login-status';
import Question from './question';
import Transition from './transition';
import EndScreen from './end-screen';
import LongPoll from '../long-poll';

const UPDATE_USER_TRACK_ACTION = '/update-me.json';

export default class App extends BoundComponent {
  constructor(props) {
    super(props);
    // State looks like:
    // {
    //   user: see simpleUserObject in server/user/views.js,
    //   lastMessageTime: Number, // the last message time sent to long-pollers
    //   activeQuestions: {
    //     all: {
    //       question: {
    //         id: String,
    //         text: String,
    //         code: String, // optional code example
    //         multiple: Boolean, // accept multiple choices
    //         answers: [{text: String}]
    //       }, 
    //       stage: String, in [acceptingAnswers, revealingAnswers, showingLiveResults, showingLiveResultsAll]
    //     },
    //     css: {question},
    //     js: {question}
    //   }
    //   naiveLoginAllowed: Boolean,
    //   showEndScreen: Boolean,
    //   showingSplitTracks: Boolean,
    //   correctAnswers: {all: [Number], css, js},
    //   answersSubmitted: {all: [Number], css, js}, answers the user submitted for the question
    // }
    this.state = props.initialState;

    if (this.state.user && !props.server) {
      // trying to stop the spinner on Safari
      window.load.then(() => {
        requestAnimationFrame(() => {
          const longPoll = new LongPoll(props.initialState.lastMessageTime);
          longPoll.on('message', (msg) => {
            // Update user data to check answers and results
            fetch('/me.json', {
              credentials: 'include'
            }).then((r) => r.json()).then((data) => {
              this.setState(Object.assign({}, msg, { user: data.user }));
            });
          });
        });
      });
    }
  }
  onUserUpdate(user) {
    this.setState({ user });
  }
  onLogout() {
    this.setState({
      user: null
    });
  }

  async onChangeTrack(ev) {
    try {
      const response = await fetch(UPDATE_USER_TRACK_ACTION, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: ev.target.value })
      });

      const data = await response.json();

      if (data.err) {
        throw Error(data.err);
      }

      this.onUserUpdate(data.user);
    } catch (err) {
      // TODO: toast?
      throw err;
    }
  }
  render({ server }, { user, activeQuestions, correctAnswers, naiveLoginAllowed, showingSplitTracks }) {
    const userTrack = (showingSplitTracks && user) ? user.track : 'all';
    const question = activeQuestions[userTrack];
    // Question: OPEN
    const shouldShowQuestion = (question && !server) ||
          // Question: CLOSED
          (question && question.questionClosed) ||
          // Question: REVEALED
          (question && question.questionClosed && correctAnswers[userTrack] && correctAnswers[userTrack].length);

    return (
      <div class="app">
        <header class="page-header">
          <div class="title">The Big Web Quiz. Yandex Edition</div>
          <LoginStatus
            server={server}
            user={user}
            onLogout={this.onLogout}
            onUserUpdate={this.onUserUpdate}
          />
        </header>
        <div class="container">
          {user ?
              (<div class="container-wrap">
                {showingSplitTracks ?
                  <TracksTabs
                    user={user}
                    onChangeTrack={this.onChangeTrack}
                  /> : ''
                }
                {shouldShowQuestion ?
                  <Question
                    key={`question-${question.id}`}
                    id={question.id}
                    title={question.title}
                    text={question.text}
                    multiple={question.multiple}
                    answers={question.answers}
                    code={question.code}
                    codeType={question.codeType}
                    closed={question.questionClosed}
                    correctAnswers={correctAnswers}
                    answersSubmitted={user.answers}
                    track={question.track}
                  />
                  :
                  <QuestionWaiting
                    key="question-waiting"
                    user={user}
                    server={server}
                    onUserUpdate={this.onUserUpdate}
                  />
                }
              </div>)
              :
              <Intro key="intro" naiveLoginAllowed={naiveLoginAllowed}/>
          }
        </div>
        <a class="privacy" href="https://github.com/poalrom/big-web-quiz" target="_blank">Forked from The Big Web Quiz by Google</a>
        {server &&
          <div class="img-preloads">
            <img src="/static/images/ic_check_circle_black_24px.svg" alt=""/>
            <img src="/static/images/ic_check_circle_white_24px.svg" alt=""/>
            <img src="/static/images/ic_check_circle_outline_black_24px.svg" alt=""/>
            <img src="/static/images/ic_check_circle_outline_white_24px.svg" alt=""/>
            <img src="/static/images/ic_close_white_24px.svg" alt=""/>
            <img src="/static/images/spinner.png" alt=""/>
          </div>
        }
      </div>
    );
  }
}

App.defaultProps = {
  server: false
};

