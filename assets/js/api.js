(function() {

    const baseUrl = 'https://performance.ally.ac';

    $(document).ready(function() {
        checkClientSecret();
        $('#api-section-authentication form input').keyup(checkClientSecret)

        $('#api-section-upload .api-try-it-out button').click(tryOutUpload)
        $('#api-section-status .api-try-it-out button').click(tryOutStatus)
        $('#api-section-report .api-try-it-out button').click(tryOutReport)
    });

    function checkClientSecret() {
        const token = getJwtToken(generateAllowAllPolicy());

        if (token) {
            $('#api-section-authentication .api-try-it-out pre').text(`Authorization: Bearer ${token}`);

            $('.api-try-it-out').show();

            if (!window.ui) {
                window.ui = true;
                ally.ready(function() {
                    window.ui = ally.ui({
                        'client': {
                            'auth': (hashId) => {
                                const policy = (hashId) ? generateFormatRequestPolicy(hashId) : generateBatchPolicy()
                                return Promise.resolve({'bearer': getJwtToken(policy)})
                            },
                            'baseUrl': baseUrl,
                            'clientId': getClientId()
                        },
                        'locale': 'en-US',
                        'platformName': 'AaaS',
                        'role': 'instructor'
                    });
                    window.ui.autoUpdate();
                });
            }
        } else {
            $('.api-try-it-out').hide();
        }
    }

    async function tryOutUpload() {
        const clientId = getClientId();
        const file = $('#api-section-upload .api-try-it-out input')[0].files[0]
        const url = `${baseUrl}/api/v2/clients/${clientId}/content`;
        const fd = new FormData();
        fd.append('file', file);

        try {
            const response = await fetch(url, {
                'body': fd,
                'headers': {
                    'Authorization': `Bearer ${getJwtToken(generateAllowAllPolicy())}`
                },
                'method': 'POST'
            });
            if (response.redirected) {
                const redirectUrl = response.url;
                setUploadResponse(`303 See Other\n\nLocation: ${redirectUrl}`);
                const contentHash = redirectUrl.split('/').pop();
                setContentHash(contentHash);
            } else if (response.status === 202) {
                const json = await response.json();
                setUploadResponse(`${response.status} ${response.statusText}\n\n${JSON.stringify(json, null, 2)}`);
            } else {
                const text = await response.text();
                setUploadResponse(`${response.status} ${response.statusText}\n\n${text}`);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function setUploadResponse(text) {
        $('#api-section-upload .api-try-it-out .response')
            .show()
            .text(text);
    }

    function setContentHash(contentHash) {
        $('input.contentHash').val(contentHash);
        $('#source').attr('data-ally-file-eid', contentHash);
    }

    async function tryOutStatus() {
        const clientId = getClientId();
        const contentHash = $('#api-section-status form input.contentHash').val();
        const url = `${baseUrl}/api/v2/clients/${clientId}/content/${contentHash}/status`;
        const response = await fetch(url, {
            'headers': {
                'Authorization': `Bearer ${getJwtToken(generateAllowAllPolicy())}`
            }
        });
        if (response.status === 200) {
            const json = await response.json();
            $('#api-section-status .api-try-it-out .response')
                .show()
                .text(`200 OK\n\n${JSON.stringify(json, null, 2)}`);
        } else {
            const text = await response.text();
            $('#api-section-status .api-try-it-out .response')
                .show()
                .text(`${response.status} ${response.statusText}\n\n${text}`);
        }
    }

    async function tryOutReport() {
        const clientId = getClientId();
        const feedback = getFeedback();
        const contentHash = $('#api-section-report form input.contentHash').val();
        let url = `${baseUrl}/api/v2/clients/${clientId}/content/${contentHash}`;
        if (feedback === 'true' || feedback === 'false') {
            url += `?feedback=${feedback}`;
        }
        const response = await fetch(url, {
            'headers': {
                'Authorization': `Bearer ${getJwtToken(generateAllowAllPolicy())}`
            }
        });
        if (response.status === 200) {
            const json = await response.json();
            $('#api-section-report .api-try-it-out .response')
                .show()
                .text(`200 OK\n\n${JSON.stringify(json, null, 2)}`);
        } else {
            const text = await response.text();
            $('#api-section-report .api-try-it-out .response')
                .show()
                .text(`${response.status} ${response.statusText}\n\n${text}`);
        }
    }

    function setExampleText(key, value) {
        $('.api-endpoint,.api-curl-request,.api-expected-response').each((i,el) => {
            const $el = $(el);
            const text = $el.text().replace(key, value);
            $el.text(text);
        })
    }

    function getClientId() {
        return $('#api-section-authentication form input#clientId').val();
    }

    function getApplicationSecret() {
        return $('#api-section-authentication form input#applicationSecret').val();
    }
    function getFeedback() {
        return $('input[name=feedback]:checked', '#api-section-report form').val();
    }

    function getJwtToken(policy) {
        const clientId = getClientId();
        const applicationSecret = getApplicationSecret();
        if (clientId && applicationSecret) {
            return generateSignature(clientId, applicationSecret, policy);
        } else {
            return null;
        }
    }

    function generateSignature(clientId, applicationSecret, policy) {
        // Header
        var oHeader = {alg: 'HS256', typ: 'JWT'};
        // Payload
        var oPayload = {'policy': policy};
        var tNow = KJUR.jws.IntDate.get('now');
        oPayload.iat = tNow;
        oPayload.clientId = clientId;
        // Sign JWT, password=616161
        var sHeader = JSON.stringify(oHeader);
        var sPayload = JSON.stringify(oPayload);
        return KJUR.jws.JWS.sign("HS256", sHeader, sPayload, applicationSecret);
    }

    function generateBatchPolicy() {
        return {
            'statements': [
                {
                    "resource": "content:*",
                    "actions": ["content:getDetails", "content:getDetails:withFormats", "content:getFormat"]
                }
            ]
        }
    }

    function generateFormatRequestPolicy(hash) {
        return {
            'statements': [
                {
                    "resource": `content:${hash}`,
                    "actions": [
                        "content:getDetails",
                        "content:getDetails:withFormats",
                        "content:getFormat"
                    ]
                }
            ]
        }
    }

    function generateAllowAllPolicy(hash) {
        return {
            'statements': [
                {
                    "resource": `content:*`,
                    "actions": [
                        "content:*",
                        "content:*:*"
                    ]
                }
            ]
        }
    }

})();