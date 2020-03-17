(function() {

    var ERRORS = {
        // API Errors
        'invalidCaptcha': 'invalid-captcha',
        'missingCaptchaToken': 'missing-captcha-token',
        'missingFilename': 'missing-filename',
        'unsupportedContentType': 'unsupported-content-type',

        // UI State errors
        'fileNotSelected': 'no-file-selected',
        'captchaNotChecked': 'captcha-not-selected',
        'somethingWentWrong': 'something-went-wrong'
    };

    $(document).ready(function() {

        resetForm();

        /** Invoked by recaptcha when its state changed (button selected, expires, ...) */
        window.recaptchaCalback = function() {
            setButtonDisabledState();
        };

        /** Invoked when a file gets selected */
        $('#covid19-af-form input').on('change', function() {
            resetForm();

            var file = getFile();
            if (file && file.name) {
                var icon = getSupportedFileType(file.name);
                if (icon) {
                    var $dropArea = $('.drop-area');
                    $dropArea.addClass('file-selected');
                    $dropArea.find('.filename').text(file.name);
                    $dropArea.find('img.fileicon').attr('src', icon);
                    $('.g-recaptcha').focus();
                } else {
                    setValidationErrors([ERRORS.unsupportedContentType]);
                }
            }
        });

        $('#covid19-af-form').on('submit', function(e) {
            if (!e.isDefaultPrevented()) {
                // If the file was already uploaded, we can simply trigger again
                var url = $('#covid19-af-form #trigger').attr('data-ally-invoke-direct-file');
                if (url) {
                    triggerAlternativeFormats(url);
                } else {
                    // Upload the file
                    var formData = $(this).serializeArray();
                    var file = getFile();
                    if (!file) {
                        throw new Error('No file selected');
                    }
                    formData.push({'name': 'filename', 'value': file.name});

                    // TODO: Exchange for S3 signature
                    $.ajax({
                        'url': 'https://4mctrq9vy0.execute-api.us-east-1.amazonaws.com/covid19',
                        'method': 'POST',
                        'data': JSON.stringify(formData),
                        'contentType': "application/json; charset=utf-8",
                        'success': function (data) {
                            try {
                                data = JSON.parse(data);
                                uploadFile(data);
                            } catch (err) {
                                // Set fail
                                setValidationErrors([ERRORS.somethingWentWrong])
                            }
                        },
                        'error': function(err) {
                            if (err.status === 400) {
                                setValidationErrors([err.responseText]);
                            } else if (err.status === 500) {
                                setValidationErrors([ERRORS.somethingWentWrong]);
                            }
                        }
                    });
                }
            }
            return false;
        });
    });

    function uploadFile(response) {
        var bucketUrl = 'https://ally-covid19-files.s3.amazonaws.com';
        var file = getFile();
        var fd = new FormData();
        Object.keys(response.form).forEach(function(key) {
            fd.append(key, response.form[key]);
        });
        fd.append('file', file);

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', function() {}, false);
        xhr.addEventListener('load', function() {
            if (this.status === 200) {
                var keyParts = response.form.key.split('/');
                keyParts.pop();
                var url = bucketUrl + '/' + keyParts.join('/') + '/' + file.name;
                triggerAlternativeFormats(url)
            }
        }, false);
        xhr.open('POST', 'https://ally-covid19-files.s3.amazonaws.com/', true);
        xhr.send(fd);
    }

    function triggerAlternativeFormats(url) {
        var $trigger = $('#covid19-af-form #trigger');
        $trigger.attr('data-ally-invoke-direct-file', url);
        $trigger[0].click();
    }

    function getFile() {
        return document.querySelector("input[type=file]").files[0];
    }

    function resetForm() {
        setValidationErrors([]);
        setButtonDisabledState();
        var $dropArea = $('.drop-area');
        $dropArea.removeClass('file-selected');
        $dropArea.find('.filename').text('');
        $('#covid19-af-form #trigger').attr('data-ally-invoke-direct-file', '');
    }

    /** Enable or disable the upload button */
    function setButtonDisabledState() {
        var file = getFile();
        if (file && file.name && getCaptchaToken()) {
            $('#covid19-af-form button').removeAttr('disabled');
        } else {
            $('#covid19-af-form button').attr('disabled', 'disabled');
        }
    }

    /** Get the recaptcha token, if any */
    function getCaptchaToken() {
        if (grecaptcha && grecaptcha.getResponse && grecaptcha.getResponse()) {
            return grecaptcha.getResponse();
        } else {
            return null;
        }
    }

    function setValidationErrors(errors) {
        errors = errors || [];

        // Clear any previous errors
        $('#covid19-af-form .validation-error').hide();

        // Enable the new errors, if any
        errors.forEach(function(err) {
            $('#covid19-af-form .validation-error.error-' + err).show();
        });
    }

    /** Given a filename, return an appropriate content-type value */
    function getSupportedFileType(filename) {
        var extension = filename.toLowerCase().split('.').pop();
        var extensionIconMapping = {
            'doc': '/assets/img/mime-types/icon-mimetype-application-doc.svg',
            'docx': '/assets/img/mime-types/icon-mimetype-application-docx.svg',
            'html': '/assets/img/mime-types/icon-mimetype-text-html.svg',
            'pdf': '/assets/img/mime-types/icon-mimetype-application-pdf.svg',
            'ppt': '/assets/img/mime-types/icon-mimetype-application-ppt.svg',
            'pptx': '/assets/img/mime-types/icon-mimetype-application-pptx.svg'
        };
        if (extensionIconMapping[extension]) {
            return extensionIconMapping[extension];
        } else {
            return null;
        }
    }
})();
