import {
    POST_UPLOADING_FAILURE, POST_UPLOADING_REQUEST,
    POST_UPLOADING_SUCCESS,
    POSTS_LOADING_FAILURE,
    POSTS_LOADING_REQUEST,
    POSTS_LOADING_SUCCESS
} from '../types';
import {put, takeEvery, all, fork, call} from 'redux-saga/effects';
import {push} from 'connected-react-router';
import axios from 'axios';

// All Posts load
const loadPostAPI = () => {
    return axios.get('/api/post')
}

function* loadPost() {
    try {
        const result = yield call(loadPostAPI);
        yield put({
            type: POSTS_LOADING_SUCCESS,
            payload: result.data,
        })

    } catch (e) {
        yield put({
            type: POSTS_LOADING_FAILURE,
            payload: e
        })
        yield push('/');
    }
}

function* watchLoadPost() {
    yield takeEvery(POSTS_LOADING_REQUEST, loadPost);
}


// Post Upload
const uploadPostAPI = (payload) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        }
    }
    const token = payload.token;
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return axios.post('/api/post', payload, config)
}

function* uploadPost(action) {
    try {
        console.log(action, "uploadPost function");
        const result = yield call(uploadPostAPI, action.payload);
        console.log(result, "uploadPostAPI, action.payload");
        yield put({
            type: POST_UPLOADING_SUCCESS,
            payload: result.data,
        });
        yield put(`/post/${result.data._id}`)
    } catch (e) {
        yield put({
            type: POST_UPLOADING_FAILURE,
            payload: e
        })
        yield push('/');
    }
}

function* watchUploadPost() {
    yield takeEvery(POST_UPLOADING_REQUEST, uploadPost);
}

export default function* postSaga() {
    yield all([
        fork(watchLoadPost),
        fork(watchUploadPost)
    ])
}
