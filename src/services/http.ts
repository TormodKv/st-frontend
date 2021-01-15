import config from '../config'
import auth from './auth'

class Http {
    public validateResponse(response: Response): Promise<Response> {
        return new Promise((resolve, reject) => {
            if (response.status >= 200 && response.status < 300) {
                resolve(response)
            } else if (response.status === 401) {
                setTimeout(() => {
                    if (!auth.isAuthenticated) {
                        auth.login()
                    }
                }, 10000)
                // auth.startLogin();
                // resolve(null);
                reject(new Error('Unauthorized'))
            } else {
                const error = new Error(response.statusText)
                // error.response = response;
                reject(error)
            }
        })
    }

    public parseJson(response: Response) {
        return response.json()
    }

    /**
     * API GET request
     *
     * @param  {String} path
     * @return {Promise}
     */
    public get<T>(path: string, bypassAuth?: boolean): Promise<T> {
        return this.apifetch(
            path,
            {
                method: 'GET'
            }, 
            bypassAuth
        )
    }

    /**
     * API POST request
     *
     * @param  {String} path
     * @param  {Object} content
     * @param  {Object} options (optional)
     * @return {Promise}
     */
    public post<T, Y = T>(
        path: string,
        content: Y,
        options?: object
    ): Promise<T> {

        return this.apifetch(
            path,
            Object.assign(
                {
                    method: 'POST',
                    body: JSON.stringify(content),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                options || {}
            )
        )
    }

    /**
     * API PATCH request
     *
     * @param  {String} path
     * @param  {Object} content
     * @param  {Object} options (optional)
     * @return {Promise}
     */
    public patch<T>(
        path: string,
        content: unknown
    ): Promise<T> {
        return this.apifetch(
            path,
            {
                method: 'PATCH',
                body: JSON.stringify(content),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
    }

    /**
     * API DELETE request
     *
     * @param  {String} path
     * @param  {Object} query (optional)
     * @param  {Object} options (optional)
     * @return {Promise}
     */
    public ['delete']<T>(
        path: string,
        options?: object
    ): Promise<T> {
        return this.apifetch(
            path,
            Object.assign(
                {
                    method: 'DELETE'
                },
                options || {}
            )
        )
    }

    /**
     * API PUT request
     *
     * @param  {String} path
     * @param  {Object} content
     * @return {Promise}
     */
    public put<T>(
        path: string,
        content: T
    ): Promise<T> {
        return this.apifetch(
            path,
            Object.assign(
                {
                    method: 'PUT',
                    body: JSON.stringify(content)
                }
            )
        )
    }

    public async apifetch(path: string, options: RequestInit, bypassAuth = false) {
        path = `${config.api.basePath}${path}`
        if (auth.token == null && !bypassAuth) throw new Error("No Authorization token available")

        const headers = Object.assign({
            'Authorization': `Bearer ${auth.token}`
        }, options.headers);

        const o = Object.assign(
        options, {headers});

        const result = fetch(path, o)
            .then(this.validateResponse)
            .then(this.parseJson)
        return result;
    }
}

const http = new Http()
export default http
