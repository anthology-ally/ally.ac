(function() {

    let language = resolveLanguage();
    document.documentElement.lang = language;

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

    var selectedFile = null;

    $(document).ready(function() {
        resetForm();

        /** Invoked when a file gets selected */
        $('#covid19-af-form input[type="file"]').on('change', function() {
            var file = $(this)[0].files[0];
            if (file && file.name) {
                selectFile(file);
            }
        });

        // Drag logic
        $('#covid19-af-form .drop-area')
            .on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
            })
            .on('dragover dragenter', function() {
                $(this).addClass('drag-on');
            })
            .on('dragleave dragend drop', function() {
                $(this).removeClass('drag-on');
            })
            .on('drop', function(e) {
                var file = [...e.originalEvent.dataTransfer.items].map((item) => item.getAsFile())[0];
                if (file && file.name) {
                    // The file is only assignable from this stack :shrug:
                    selectFile(file);
                }
            });

        // The university field
        var universityField = '#covid19-af-form input[type="text"]';
        $(universityField).on('change', setButtonDisabledState);
        $(universityField).on('keyup', setButtonDisabledState);
        var university = getUniversity();
        if (university) {
            $(universityField).val(university);
            $(universityField).hide();
            $('label[for="form-institution"]').hide();
        }

        /** Invoked by recaptcha when the user confirms they're a human */
        window.recaptchaCalback = function() {
            setButtonDisabledState();
        };

        /** Invoked by recaptcha when the users recaptcha token expires */
        window.recaptchaExpiredCalback = function() {
            setButtonDisabledState();
        }

        $('#covid19-af-form').on('submit', function(e) {
            if (!e.isDefaultPrevented()) {
                setProgress(0);
                var university = getUniversity();
                saveUniversity(university);
                showStep(3, true);
                // If the file was already uploaded, we can simply trigger again
                var url = $('#covid19-af-form #trigger').attr('data-ally-invoke-direct-file');
                if (url) {
                    triggerAlternativeFormats(url);
                } else if (!selectedFile) {
                    setValidationErrors([ERRORS.fileNotSelected]);
                } else {
                    // Upload the file
                    var formData = $(this).serializeArray();
                    formData.push({'name': 'filename', 'value': selectedFile.name});

                    // Exchange the recaptcha token for an S3 signature so that the file can be uploaded.
                    $.ajax({
                        'url': 'https://852r0t7rv3.execute-api.eu-central-1.amazonaws.com/live',
                        'method': 'POST',
                        'data': JSON.stringify(formData),
                        'contentType': "application/json; charset=utf-8",
                        'success': function (data) {
                            // Note that this invalidates the recaptcha
                            grecaptcha.reset();
                            uploadFile(data);
                        },
                        'error': function(err) {
                            // Note that this invalidates the recaptcha
                            grecaptcha.reset();
                            showStep(1);
                            if (err.status === 400) {
                                setValidationErrors([err.responseText]);
                            } else {
                                setValidationErrors([ERRORS.somethingWentWrong]);
                            }
                        }
                    });
                }
            }
            return false;
        });

        $.i18n().load({
            [language]: `/assets/locale/covid19/${language}.json`
        }).done(function () {
            $.i18n().locale = language;
            $('body').i18n();
            setProgress(0);
        });

    });

    function resolveLanguage() {
        const defaultLanguage = 'en'
        const supportedLanguages = ['de', 'en', 'es', 'fr', 'it']
        const languages = navigator.languages;

        const url = new URL(document.location.href);
        const locale = url.searchParams.get('locale');

        let language;
        if (locale && supportedLanguages.includes(localeToLanguage(locale))) {
            language = localeToLanguage(locale);
        } else if (languages && languages.length > 0) {
            language = languages.map(l => l.slice(0, 2))
              .filter(l => supportedLanguages.includes(l))[0] || defaultLanguage;
        } else if (navigator.language) {
            language = navigator.language.slice(0, 2);
        } else {
            language = defaultLanguage;
        }
        return language;
    }

    function localeToLanguage(locale) {
        return locale.slice(0, 2);
    }

    /** Upload the file */
    function uploadFile(response) {
        var bucketUrl = 'https://' + response.bucketUrl;
        // Start the upload
        $('#covid19-af-form .step1').addClass('is-uploading');
        var fd = new FormData();
        Object.keys(response.form).forEach(function(key) {
            fd.append(key, response.form[key]);
        });
        fd.append('file', selectedFile);

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(progress) {
            if (progress.lengthComputable) {
                setProgress(progress.loaded / progress.total);
            }
        }, false);
        xhr.addEventListener('load', function() {
            if (this.status === 200) {
                var parts = response.form.key.split('/');
                var fileName = encodeURIComponent(parts.pop());
                var url = bucketUrl + '/' + parts.join('/') + '/' + fileName
                triggerAlternativeFormats(url)
            } else {
                setValidationErrors([ERRORS.somethingWentWrong]);
            }
        }, false);
        xhr.open('POST', bucketUrl, true);
        xhr.send(fd);
    }

    /** Trigger the alternative formats modal for the given state */
    function triggerAlternativeFormats(url) {
        var $trigger = $('#covid19-af-form #trigger');
        $trigger.attr('data-ally-invoke-direct-file', '');
        $trigger.attr('href', url);
        $trigger.text(selectedFile.name);
        $trigger[0].click();
        $('.step3').hide();

        // The AF takes a second to load, leave the progress bar visible for a while
        setTimeout(function() {
            $('#covid19-af-form .step1').removeClass('is-uploading');
            resetForm();
            showStep(1, false);
        }, 1000);
    }

    /** Reset the form to its initial state */
    function resetForm() {
        selectedFile = null;
        setValidationErrors([]);
        $('.step1')
            .removeClass('is-uploading')
            .removeClass('file-selected')
            .find('.filename').text('');
        $('#covid19-af-form #trigger').attr('data-ally-invoke-direct-file', '');
        setButtonDisabledState();
    }

    function setButtonDisabledState() {
        if (getUniversity() && getCaptchaToken()) {
            $('#covid19-af-form button').removeAttr('disabled');
        } else {
            $('#covid19-af-form button').attr('disabled', 'disabled');
        }
    }

    function saveUniversity(university) {
        localStorage.setItem('university', university);
    }

    function getUniversity() {
        const university = getUniversityFromURL();
        const universityFromStorage = getUniversityFromStorage();
        if (university && university.length > 0) {
            return university;
        } else if (universityFromStorage && universityFromStorage.length > 0) {
            return universityFromStorage;
        } else {
            return $('#covid19-af-form input[type="text"]').val();
        }
    }

    function getUniversityFromURL() {
        const url = new URL(document.location.href);
        return url.searchParams.get('siteId');
    }

    function getUniversityFromStorage() {
        return window.localStorage.getItem('university');
    }

    /** Get the recaptcha token, if any */
    function getCaptchaToken() {
        if (grecaptcha && grecaptcha.getResponse && grecaptcha.getResponse()) {
            return grecaptcha.getResponse();
        } else {
            return null;
        }
    }

    /** Set the given file as the selected file and move to the next step */
    function selectFile(file) {
        resetForm();
        selectedFile = file;
        var icon = getSupportedFileType(file.name);
        if (icon) {
            var $step1 = $('.step1');
            $step1.addClass('file-selected');
            $step1.find('.filename').text(file.name);
            $step1.find('img.fileicon').attr('src', icon);
            $('.g-recaptcha').focus();

            // Show a spinner for a bit to show "transition"
            setTimeout(function() {
                showStep(2, true);
                $step1.removeClass('file-selected');
            }, 1000);
        } else {
            setValidationErrors([ERRORS.unsupportedContentType]);
        }
    }

    /** Show the given step */
    function showStep(n, moveFocus) {
        $('.step').removeClass('show-step');
        var $step = $('.step.step' + n).addClass('show-step');
        if (moveFocus) {
            $step.find('input, label, [tabindex="-1"]').first().focus();
        }
    }

    function setProgress(percent) {
        var loaded = Math.floor(percent * 90);

        $('#covid19-af-form .progress .progress-bar')
            .attr('aria-valuenow', loaded)
            .css({
                // Don't go all the way to 100 as there's a bit more work to do after the file is uploaded
                // but we can't really track progress for it. By leaving a little gap, there's the illusion
                // that there's more to do which informs the user they should wait
                'width': loaded + '%'
            })
            .find('.sr-only')
            .text($.i18n('PROGRESS', loaded));
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
