const $j = jQuery.noConflict();
class CustomDataLayer {

    constructor({formType, formTitle, formId, errorClass = 'error', gaEvent = 'form_submission'}) {

        this.data = { formType, formTitle, formId, errorClass, gaEvent }

        //invoke events
        this.events();
    }
    
    events() {
        if (this.data.formType === 'generic') {
            $j(document).on("click", `#${this.data.formId} input[type='submit']`, this.genericFormSubmit.bind(this))
        }
        if (this.data.formType === 'hubspot_popup') {
            document.addEventListener("submit", this.hsPopUpFormSubmit.bind(this));
            document.addEventListener("submit", this.hsFormSubmit.bind(this));
            CustomDataLayer.debug(`added event listener for hubspot_popup form ${this.data.formId}`);

        }
        if (this.data.formType === 'hubspot') {
            document.addEventListener("submit", this.hsFormSubmit.bind(this));
            window.addEventListener('message', this.hubspotCompleted.bind(this));
            CustomDataLayer.debug(`added event listener for hubspot form ${this.data.formId}`);
        }
        if (this.data.formType === 'ninjaforms') {
            document.addEventListener("click", this.nfFormSubmit.bind(this));
            $j(document).on('nfFormSubmitResponse', this.nfCompleted.bind(this));
            CustomDataLayer.debug(`added event listener for ninjaform ${this.data.formId}`);
        }
    }

    genericFormSubmit(e) {
        const form = $j(e.target).closest('form')[0];
        CustomDataLayer.debug('generic form submit', [this.data.formId, form.getAttribute('id'), form, e.target,this]);
        
        if( form.getAttribute('id') !== this.data.formId ) {
            return;
        }


        //push attempt in datalayer
        CustomDataLayer.dlPush({
            'event': `${this.data.gaEvent}_attempt`,
            'form_name': this.data.formTitle,
            'form_id': this.data.formId
        });

        const required_elements = form.elements;
        this.data.errors = [...required_elements].filter(e => e && !e.checkValidity()).map(e => e && e.name);
        if (this.data.errors.length > 0 ) {
            CustomDataLayer.debug({form, errors: this.data.errors});
            CustomDataLayer.dlPush({
                'event': `${this.data.gaEvent}_failure`,
                'form_name': this.data.formTitle,
                'failure_reason': this.data.errors,
                'form_id': this.data.formId
            });
        }else{
            CustomDataLayer.debug('form validated!');
            CustomDataLayer.dlPush({
                'event': `${this.data.gaEvent}_complete`,
                'form_name': this.data.formTitle,
                'form_id': this.data.formId
            });
        }
    }
    
    hubspotCompleted(event) {
        if(event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormSubmit') {
            if(event.data.id === this.data.formId) {
                CustomDataLayer.debug('form completed: datalayer push SUCCESS!', event.data);
                CustomDataLayer.dlPush({
                    'event': `${this.data.gaEvent}_complete`,
                    'form_name': this.data.formTitle,
                    'form_id': this.data.formId
                });
            }else{
                //CustomDataLayer.debug(`form not completed for: ${this.data.formId}`);
                //CustomDataLayer.debug(`HS Form Check:`, [`target: ${this.data.formId}`,`event: ${event.data.id}`], event.data);
            }
        }
    }

    hsPopUpFormSubmit(e) {
        //do nothing if declared form is not equal to target
        if(e.target.dataset.formId !== this.data.formId) {
            return;
        }

        //get the target modal
        const modals = document.querySelectorAll('.leadinModal');
        const target_modal = [...modals].find(modal => modal.contains(e.target));
        
        if(target_modal !== null) {
            //attach form id to popup wrapper
            target_modal.dataset.gaTarget = this.data.formId;
            
            if(!this.leadinObserverStated) {
                //leadinObserver.observe(target_modal, {childList: true})

                // Create the observer instance
                this.observer = new MutationObserver(this.hsPopUpObserver.bind(this));
                // Start observing the form's parent node
                this.observer.observe(target_modal, {childList: true, subtree: true});
                this.leadinObserverStated =  true;
                CustomDataLayer.debug(`added observer for ${target_modal}`);
            }
        }
    }

    hsPopUpObserver(mutationsList) {
        CustomDataLayer.debug('Modal mutation', mutationsList);
        for (let mutation of mutationsList) {
          // Check if the confirmation element has been added
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && $j(mutation.addedNodes).children('.leadin-thank-you-wrapper').length > 0) {
            CustomDataLayer.debug('Form confirmation element added!');
            CustomDataLayer.debug(`Node Added`, mutation.addedNodes)
            CustomDataLayer.dlPush({
              'event': `${this.data.gaEvent}_complete`,
              'form_name': this.data.formTitle,
              'form_id': this.data.formId
            });
            // Disconnect the observer
            this.observer.disconnect();
          }
        }
      }
    
    hsFormSubmit(e) {
        const { target : { elements }, target } = e;

        //do nothing if declared form is not equal to target
        if(target.dataset.formId !== this.data.formId) {
            return;
        }

        //continue execution
        const inputs = Array.from(elements);
        const formData = {};
        const errors = [];

        //const filteredInputs = inputs.filter(input => input.classList.contains('hs-input'));

        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;

                if (input.classList.contains(this.data.errorClass)) {
                    errors.push(input.name);
                }
            }
        });
        
        //save data
        this.data = {...this.data, errors, formData, eventTarget : target.getAttribute('id')};

        //push attempt in datalayer
        CustomDataLayer.dlPush({
                'event': `${this.data.gaEvent}_attempt`,
                'form_name': this.data.formTitle,
                'form_id': this.data.formId
            });

        if(this.data.errors.length > 0) {
            CustomDataLayer.debug('form has error!');
            const data = {
                'event': `${this.data.gaEvent}_failure`,
                'form_name': this.data.formTitle,
                'failure_reason': this.data.errors,
                'form_id': this.data.formId
            }
            CustomDataLayer.dlPush(data);
        }else{
            CustomDataLayer.debug("Form Validated!");
        }
    }

    nfCompleted(event, response, id) {
        const data = {
            'event' : `${this.data.gaEvent}_complete`,
            'form_name' : this.data.formTitle,
            'form_id' : this.data.formId
        }
        response.id === this.data.formId && CustomDataLayer.dlPush(data);
        CustomDataLayer.debug('ninja form submitted', `target form ${this.data.formId}`, response, data);
    }

    nfFormSubmit(e) {
        const form_cont = document.querySelector(`#nf-form-${this.data.formId}-cont`);

        if( form_cont !== null ) {
            const btn = form_cont.querySelector(`input[type="submit"]`);
            if (e.target.id === btn.id) {
                const attempt_data = {
                    'event': `${this.data.gaEvent}_attempt`,
                    'form_name': this.data.formTitle,
                    'form_id': this.data.formId
                }
                CustomDataLayer.dlPush(attempt_data); // push attempt
    
                //start error capture
                this.data.errors = [...form_cont.querySelectorAll(`.${this.data.errorClass}`)].map(e => e && e.querySelector('.ninja-forms-field').name );
    
                if(this.data.errors.length > 0) {
                    const data = {
                        'event': `${this.data.gaEvent}_failed`,
                        'form_name': this.data.formTitle,
                        'form_id': this.data.formId,
                        'failure_reason': this.data.errors
                    }
                    CustomDataLayer.dlPush(data); // push failed
                }
            }
        }//end if
    }

    static dlPush(data = {}) {
        CustomDataLayer.debug('dlPush', data);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(data);
    }

    static btnEvent({btnEvent, btnId, btnClass, gaEvent}) {
        CustomDataLayer.debug(`added ${btnEvent} event listener for ${btnId || btnClass}`);
        
        if(btnId) {
            addEventListener(btnEvent, (e) => {
                const elemId = e.target.id;
                const elemClass = e.target.className.split(' ');
                const elemParentId = e.target.parentElement.id;
                if((elemId === btnId) || elemParentId === btnId) {
                    CustomDataLayer.debug(`clicked ${btnId}`);
                    const data = {'event': gaEvent, btnId, elemId, elemClass, elemParentId}
                    CustomDataLayer.dlPush(data);
                }
            });
        }
        if(btnClass) {
            addEventListener(btnEvent, (e) => {
                const elemClassList = e.target.classList;
                if(elemClassList.contains(btnClass)) {
                    CustomDataLayer.debug(`clicked ${btnClass}`);
                    const data = {'event': gaEvent, btnClass}
                    CustomDataLayer.dlPush(data);
                }
            });
        }
    }

    static isChild(parent, child) {
        return parent.contains(child) ? true : false
    }

    static disableElemEvent({elemClass = 'btn', elemEvent = 'click'} = {}) {
        document.querySelectorAll(`.${elemClass}`).forEach(btn => { 
            btn.addEventListener(elemEvent, (e) => e.preventDefault())
        })
        CustomDataLayer.debug(`${elemEvent} event has been disabled for ${elemClass} class! \nYou can specify element class and event you wish to disable ex. \nCustomDataLayer.disableElemEvent({elemClass:'btn', elemEvent:'click'})`);
    }
    static debug(...message) {
        return; //comment out this line to enable debugging
        if (typeof console !== 'undefined' && console.debug) {
          console.debug('CustomDataLayer:',...message);
        }
    }
}//end CustomDataLayer Class