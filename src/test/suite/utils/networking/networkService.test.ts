  import * as assert from 'assert';
  import { suite, test } from 'mocha';
  import * as sinon from 'sinon';
  import * as fetchModule from 'node-fetch';
  import { networkService } from '../../../../utils/networking/networkService';
  import { ExtensionError, ErrorType } from '../../../../utils/monitoring/errorHandler';

// Mock Response class
class MockResponse {
  private _ok: boolean;
  private _status: number;
  private _statusText: string;
  private _data: any;
  private _headers: Map<string, string>;

  constructor(ok: boolean, status: number, statusText: string, data: any, contentType: string = 'application/json') {
    this._ok = ok;
    this._status = status;
    this._statusText = statusText;
    this._data = data;
    this._headers = new Map<string, string>();
    this._headers.set('content-type', contentType);
  }

  get ok(): boolean {
    return this._ok;
  }

  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  headers = {
    get: (name: string) => this._headers.get(name.toLowerCase())
  };

  async json() {
    if (typeof this._data === 'object') {
      return this._data;
    }
    throw new Error('Cannot parse as JSON');
  }

  async text() {
    return String(this._data);
  }

  async arrayBuffer() {
    return Buffer.from(String(this._data));
  }
}

suite('NetworkService Tests', () => {
  let fetchStub: sinon.SinonStub;
  
  setup(() => {
    // Stub the fetch function
    fetchStub = sinon.stub(fetchModule, 'default');
  });
  
  teardown(() => {
    // Restore the fetch function
    fetchStub.restore();
  });
  
  test('get should make a GET request', async () => {
    // Setup mock response
    const mockData = { success: true, data: 'test data' };
    fetchStub.resolves(new MockResponse(true, 200, 'OK', mockData));
    
    // Call get method
    const result = await networkService.get('https://example.com');
    
    // Verify fetch was called with correct parameters
    assert.strictEqual(fetchStub.calledOnce, true);
    assert.strictEqual(fetchStub.firstCall.args[0], 'https://example.com');
    assert.deepStrictEqual(fetchStub.firstCall.args[1].method, 'GET');
    
    // Verify result is correct
    assert.deepStrictEqual(result, mockData);
  });
  
  test('post should make a POST request with JSON body', async () => {
    // Setup mock response
    const mockData = { success: true, data: 'test data' };
    const postData = { test: 'post data' };
    fetchStub.resolves(new MockResponse(true, 200, 'OK', mockData));
    
    // Call post method
    const result = await networkService.post('https://example.com', postData);
    
    // Verify fetch was called with correct parameters
    assert.strictEqual(fetchStub.calledOnce, true);
    assert.strictEqual(fetchStub.firstCall.args[0], 'https://example.com');
    assert.deepStrictEqual(fetchStub.firstCall.args[1].method, 'POST');
    assert.strictEqual(fetchStub.firstCall.args[1].headers['Content-Type'], 'application/json');
    assert.strictEqual(fetchStub.firstCall.args[1].body, JSON.stringify(postData));
    
    // Verify result is correct
    assert.deepStrictEqual(result, mockData);
  });
  
  test('post should make a POST request with text body', async () => {
    // Setup mock response
    const mockData = { success: true, data: 'test data' };
    const postData = 'plain text post data';
    fetchStub.resolves(new MockResponse(true, 200, 'OK', mockData));
    
    // Call post method
    const result = await networkService.post('https://example.com', postData);
    
    // Verify fetch was called with correct parameters
    assert.strictEqual(fetchStub.calledOnce, true);
    assert.strictEqual(fetchStub.firstCall.args[0], 'https://example.com');
    assert.deepStrictEqual(fetchStub.firstCall.args[1].method, 'POST');
    assert.strictEqual(fetchStub.firstCall.args[1].headers['Content-Type'], 'text/plain');
    assert.strictEqual(fetchStub.firstCall.args[1].body, postData);
    
    // Verify result is correct
    assert.deepStrictEqual(result, mockData);
  });
  
  test('request should handle HTTP errors', async () => {
    // Setup mock error response
    fetchStub.resolves(new MockResponse(false, 404, 'Not Found', { error: 'not found' }));
    
    // Call request method and verify it throws the expected error
    try {
      await networkService.request('https://example.com');
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.ok(error instanceof ExtensionError);
      assert.strictEqual((error as ExtensionError).type, ErrorType.NETWORK_RESPONSE);
      assert.ok((error as ExtensionError).message.includes('404'));
      assert.strictEqual((error as ExtensionError).details.status, 404);
    }
  });
  
  test('request should handle network errors and retry', async () => {
    // Setup fetch to fail twice then succeed
    const mockData = { success: true, data: 'test data' };
    fetchStub.onCall(0).rejects(new Error('Network error'));
    fetchStub.onCall(1).rejects(new Error('Network error again'));
    fetchStub.onCall(2).resolves(new MockResponse(true, 200, 'OK', mockData));
    
    // Configure to retry quickly
    const options = {
      retries: 3,
      retryDelay: 10
    };
    
    // Call request method
    const result = await networkService.request('https://example.com', options);
    
    // Verify fetch was called multiple times
    assert.strictEqual(fetchStub.callCount, 3);
    
    // Verify result is correct
    assert.deepStrictEqual(result, mockData);
  });
  
  test('request should handle different content types', async () => {
    // JSON response
    fetchStub.onCall(0).resolves(new MockResponse(true, 200, 'OK', { data: 'json' }, 'application/json'));
    const jsonResult = await networkService.request('https://example.com');
    assert.deepStrictEqual(jsonResult, { data: 'json' });
    
    // Text response
    fetchStub.onCall(1).resolves(new MockResponse(true, 200, 'OK', 'text data', 'text/plain'));
    const textResult = await networkService.request('https://example.com');
    assert.strictEqual(textResult, 'text data');
    
    // Binary response
    fetchStub.onCall(2).resolves(new MockResponse(true, 200, 'OK', 'binary data', 'application/octet-stream'));
    const binaryResult = await networkService.request('https://example.com');
    assert.ok(binaryResult instanceof ArrayBuffer);
  });
  
  test('request should throw after maximum retries', async () => {
    // Setup fetch to always fail
    fetchStub.rejects(new Error('Network error'));
    
    // Configure to retry quickly
    const options = {
      retries: 2,
      retryDelay: 10
    };
    
    // Call request method and verify it throws the expected error
    try {
      await networkService.request('https://example.com', options);
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.ok(error instanceof ExtensionError);
      assert.strictEqual((error as ExtensionError).type, ErrorType.NETWORK_REQUEST);
      assert.ok((error as ExtensionError).message.includes('failed after 3 attempts'));
    }
    
    // Verify fetch was called the expected number of times
    assert.strictEqual(fetchStub.callCount, 3);
  });
}); 