window.onload = function () {
  // Helper to read cookie value
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  // Add requestInterceptor to inject CSRF token
  window.ui = SwaggerUIBundle({
    url: '/api-docs/swagger.json', // This should be JSON, not YAML
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout',
    requestInterceptor: (req) => {
      const csrfToken = getCookie('XSRF-TOKEN');
      if (csrfToken) {
        req.headers['X-XSRF-TOKEN'] = csrfToken;
      }
      return req;
    },
  });
};
