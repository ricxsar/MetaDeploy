import requests

from unittest import mock

from ..views import (
    SalesforceOAuth2CustomAdapter,
    SaveInstanceUrlMixin,
)


def test_SalesforceOAuth2CustomAdapter_base_url(rf):
    request = rf.get('/?custom_domain=foo')
    request.session = {}
    adapter = SalesforceOAuth2CustomAdapter(request)
    assert adapter.base_url == 'https://foo.my.salesforce.com'


def test_SaveInstanceUrlMixin_complete_login(mocker):
    # This is a mess of terrible mocking and I do not like it.
    # This is really just to exercise the mixin, and confirm that it
    # assigns instance_url
    mocker.patch('requests.get')
    adapter = SaveInstanceUrlMixin()
    adapter.userinfo_url = None
    adapter.get_provider = mock.MagicMock()
    slfr = mock.MagicMock()
    slfr.account.extra_data = {}
    prov_ret = mock.MagicMock()
    prov_ret.sociallogin_from_response.return_value = slfr
    adapter.get_provider.return_value = prov_ret

    ret = adapter.complete_login(
        None,
        None,
        None,
        response={'instance_url': 'https://example.com'},
    )
    assert ret.account.extra_data['instance_url'] == 'https://example.com'


def test_SaveInstanceUrlMixin_complete_login_fail(mocker):
    # This is a mess of terrible mocking and I do not like it.
    # This is really just to exercise the mixin, and confirm that it
    # assigns organization_details to None if there's an error.
    bad_response = mock.MagicMock()
    bad_response.raise_for_status.side_effect = requests.HTTPError
    get = mocker.patch('requests.get')
    get.side_effect = [
        mock.MagicMock(),
        bad_response,
    ]
    adapter = SaveInstanceUrlMixin()
    adapter.userinfo_url = None
    adapter.get_provider = mock.MagicMock()
    slfr = mock.MagicMock()
    slfr.account.extra_data = {}
    prov_ret = mock.MagicMock()
    prov_ret.sociallogin_from_response.return_value = slfr
    adapter.get_provider.return_value = prov_ret

    ret = adapter.complete_login(None, None, None, response={})
    assert ret.account.extra_data['organization_details'] is None
