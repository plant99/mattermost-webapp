// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getConfig, getLicense} from 'mattermost-redux/selectors/entities/general';

import {GlobalState} from 'types/store';

import MFAController from './mfa_controller';

function mapStateToProps(state: GlobalState) {
    const license = getLicense(state);
    const config = getConfig(state);

    const mfa = license.MFA === 'true';
    const enableMultifactorAuthentication = config.EnableMultifactorAuthentication === 'true';
    const enforceMultifactorAuthentication = config.EnforceMultifactorAuthentication === 'true';
    /* eslint-disable no-console */
    console.log(enableMultifactorAuthentication, enforceMultifactorAuthentication);
    /* eslint-enable no-console */
    return {
        mfa,
        enableMultifactorAuthentication,
        enforceMultifactorAuthentication,
    };
}

export default connect(mapStateToProps)(MFAController);
