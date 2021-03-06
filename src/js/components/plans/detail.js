// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import i18n from 'i18next';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { CONSTANTS } from 'store/plans/reducer';
import { fetchPreflight, startPreflight } from 'store/plans/actions';
import { fetchPlan, fetchProduct, fetchVersion } from 'store/products/actions';
import { selectOrg } from 'store/org/selectors';
import {
  selectPlan,
  selectPlanSlug,
  selectPreflight,
} from 'store/plans/selectors';
import {
  selectProduct,
  selectProductSlug,
  selectVersion,
  selectVersionLabel,
} from 'store/products/selectors';
import { selectUserState } from 'store/user/selectors';
import {
  getLoadingOrNotFound,
  shouldFetchPlan,
  shouldFetchVersion,
} from 'components/utils';
import { startJob } from 'store/jobs/actions';
import BackLink from 'components/backLink';
import BodyContainer from 'components/bodyContainer';
import CtaButton, { LoginBtn } from 'components/plans/ctaButton';
import Header from 'components/header';
import Intro from 'components/plans/intro';
import OldVersionWarning from 'components/products/oldVersionWarning';
import PageHeader from 'components/plans/header';
import PlanNotAllowed from 'components/products/notAllowed';
import PreflightResults, {
  ErrorIcon,
  WarningIcon,
} from 'components/plans/preflightResults';
import ProductNotFound from 'components/products/product404';
import StepsTable from 'components/plans/stepsTable';
import Toasts from 'components/plans/toasts';
import UserInfo from 'components/plans/userInfo';
import type { AppState } from 'store';
import type { InitialProps } from 'components/utils';
import type { JobData } from 'store/jobs/actions';
import type { Org as OrgType } from 'store/org/reducer';
import type {
  Plan as PlanType,
  Preflight as PreflightType,
  Step as StepType,
} from 'store/plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'store/products/reducer';
import type { User as UserType } from 'store/user/reducer';

export type SelectedSteps = Set<string>;
type Props = {
  ...InitialProps,
  user: UserType,
  product: ProductType | null | void,
  productSlug: ?string,
  version: VersionType | null,
  versionLabel: ?string,
  plan: PlanType | null,
  planSlug: ?string,
  preflight: ?PreflightType,
  org: OrgType,
  doFetchProduct: typeof fetchProduct,
  doFetchVersion: typeof fetchVersion,
  doFetchPlan: typeof fetchPlan,
  doFetchPreflight: typeof fetchPreflight,
  doStartJob: (data: JobData) => Promise<any>,
  doStartPreflight: typeof startPreflight,
};
type State = {
  changedSteps: Map<string, boolean>,
};

const { RESULT_STATUS } = CONSTANTS;

class PlanDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { changedSteps: new Map() };
  }

  fetchProductIfMissing() {
    const { product, productSlug, doFetchProduct } = this.props;
    if (product === undefined && productSlug) {
      // Fetch product from API
      doFetchProduct({ slug: productSlug });
    }
  }

  fetchVersionIfMissing() {
    const { product, version, versionLabel, doFetchVersion } = this.props;
    if (
      product &&
      versionLabel &&
      shouldFetchVersion({ product, version, versionLabel })
    ) {
      // Fetch version from API
      doFetchVersion({ product: product.id, label: versionLabel });
    }
  }

  fetchPlanIfMissing() {
    const { product, version, plan, planSlug, doFetchPlan } = this.props;
    if (
      product &&
      version &&
      planSlug &&
      shouldFetchPlan({ version, plan, planSlug })
    ) {
      // Fetch plan from API
      doFetchPlan({
        product: product.id,
        version: version.id,
        slug: planSlug,
      });
    }
  }

  fetchPreflightIfMissing() {
    const { user, plan, preflight, doFetchPreflight } = this.props;
    if (user && plan && preflight === undefined && plan.requires_preflight) {
      // Fetch most recent preflight result (if any exists)
      doFetchPreflight(plan.id);
    }
  }

  componentDidMount() {
    this.fetchProductIfMissing();
    this.fetchVersionIfMissing();
    this.fetchPlanIfMissing();
    this.fetchPreflightIfMissing();
  }

  componentDidUpdate(prevProps) {
    const {
      product,
      productSlug,
      version,
      versionLabel,
      user,
      plan,
      planSlug,
      preflight,
    } = this.props;
    const productChanged =
      product !== prevProps.product || productSlug !== prevProps.productSlug;
    const versionChanged =
      productChanged ||
      version !== prevProps.version ||
      versionLabel !== prevProps.versionLabel;
    const userChanged = user !== prevProps.user;
    const planChanged =
      versionChanged ||
      plan !== prevProps.plan ||
      planSlug !== prevProps.planSlug;
    const preflightChanged = preflight !== prevProps.preflight;
    if (productChanged) {
      this.fetchProductIfMissing();
    }
    if (versionChanged) {
      this.fetchVersionIfMissing();
    }
    if (userChanged || planChanged || preflightChanged) {
      this.fetchPreflightIfMissing();
    }
    if (planChanged) {
      this.fetchPlanIfMissing();
    }
  }

  handleStepsChange = (stepId: string, checked: boolean) => {
    const changedSteps = new Map(this.state.changedSteps);
    changedSteps.set(stepId, checked);
    this.setState({ changedSteps });
  };

  getVisibleSteps(): Array<StepType> {
    const { plan, preflight } = this.props;
    const steps = [];
    if (!plan || !plan.steps) {
      return steps;
    }
    for (const step of plan.steps) {
      const { id } = step;
      const result = preflight && preflight.results && preflight.results[id];
      if (!result || result.status !== RESULT_STATUS.HIDE) {
        steps.push(step);
      }
    }
    return steps;
  }

  getSelectedSteps(): SelectedSteps {
    const { plan, preflight } = this.props;
    const selectedSteps = new Set();
    /* istanbul ignore if */
    if (!plan || !plan.steps) {
      return selectedSteps;
    }
    const { changedSteps } = this.state;
    for (const step of plan.steps) {
      const { id } = step;
      const result = preflight && preflight.results && preflight.results[id];
      let hidden, skipped, optional;
      if (result) {
        hidden = result.status === RESULT_STATUS.HIDE ? result : null;
        skipped = result.status === RESULT_STATUS.SKIP ? result : null;
        optional = result.status === RESULT_STATUS.OPTIONAL ? result : null;
      }
      if (!hidden && !skipped) {
        const required = step.is_required && !optional;
        const recommended = !required && step.is_recommended;
        const manuallyChecked = changedSteps.get(id) === true;
        const manuallyUnchecked = changedSteps.get(id) === false;
        if (
          required ||
          manuallyChecked ||
          (recommended && !manuallyUnchecked)
        ) {
          selectedSteps.add(id);
        }
      }
    }
    return selectedSteps;
  }

  getPostMessage(): React.Node {
    const { user, product, version, plan, org } = this.props;
    /* istanbul ignore if */
    if (!product || !version || !plan) {
      return null;
    }
    if (user && !user.org_type) {
      return (
        <>
          <div className="slds-p-bottom_xx-small">
            <ErrorIcon />
            <span className="slds-text-color_error">
              {i18n.t(
                'Oops! It looks like you don’t have permissions to run an installation on this org.',
              )}
            </span>
          </div>
          <p>
            {i18n.t(
              'Please contact an Admin within your org or use the button below to log in with a different org.',
            )}
          </p>
        </>
      );
    }
    if (org) {
      if (org.current_job) {
        const { product_slug, version_label, plan_slug, id } = org.current_job;
        return (
          <p>
            <WarningIcon />
            <span>
              <Trans i18nKey="installationCurrentlyRunning">
                An installation is currently running on this org.{' '}
                <Link
                  to={routes.job_detail(
                    product_slug,
                    version_label,
                    plan_slug,
                    id,
                  )}
                >
                  View the running installation.
                </Link>
              </Trans>
            </span>
          </p>
        );
      }
      if (org.current_preflight) {
        return (
          <p>
            <WarningIcon />
            <span>
              {i18n.t(
                'A pre-install validation is currently running on this org.',
              )}
            </span>
          </p>
        );
      }
    }
    return null;
  }

  getCTA(selectedSteps: SelectedSteps): React.Node {
    const {
      history,
      user,
      product,
      version,
      plan,
      preflight,
      org,
      doStartPreflight,
      doStartJob,
    } = this.props;
    /* istanbul ignore if */
    if (!product || !version || !plan) {
      return null;
    }
    if (user && !user.org_type) {
      return (
        <LoginBtn
          id="org-not-allowed-login"
          label={i18n.t('Log in with a different org')}
        />
      );
    } else if (plan.steps && plan.steps.length) {
      return (
        <CtaButton
          history={history}
          user={user}
          productSlug={product.slug}
          clickThroughAgreement={product.click_through_agreement}
          versionLabel={version.label}
          plan={plan}
          preflight={preflight}
          selectedSteps={selectedSteps}
          preventAction={Boolean(
            org && (org.current_job || org.current_preflight),
          )}
          doStartPreflight={doStartPreflight}
          doStartJob={doStartJob}
        />
      );
    }
    return null;
  }

  render(): React.Node {
    const {
      user,
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      preflight,
      history,
    } = this.props;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      route: 'plan_detail',
    });
    if (loadingOrNotFound !== false) {
      return loadingOrNotFound;
    }
    // this redundant check is required to satisfy Flow:
    // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
    /* istanbul ignore if */
    if (!product || !version || !plan) {
      return <ProductNotFound />;
    }

    const steps = this.getVisibleSteps();
    const selectedSteps = this.getSelectedSteps();

    const isMostRecent =
      product.most_recent_version &&
      new Date(version.created_at) >=
        new Date(product.most_recent_version.created_at);

    return (
      <DocumentTitle
        title={`${plan.title} | ${product.title} | ${window.SITE_NAME}`}
      >
        <>
          <Header history={history} />
          <PageHeader
            product={product}
            version={version}
            plan={plan}
            userLoggedIn={Boolean(user && user.valid_token_for)}
            preflightStatus={preflight && preflight.status}
            preflightIsValid={Boolean(preflight && preflight.is_valid)}
            preflightIsReady={Boolean(preflight && preflight.is_ready)}
          />
          {product.is_allowed && plan.is_allowed ? (
            <BodyContainer>
              {product.most_recent_version && !isMostRecent ? (
                <OldVersionWarning
                  link={routes.version_detail(
                    product.slug,
                    product.most_recent_version.label,
                  )}
                />
              ) : null}
              {preflight && user ? (
                <Toasts
                  preflight={preflight}
                  label={i18n.t('Pre-install validation')}
                />
              ) : null}
              <Intro
                averageDuration={plan.average_duration}
                isProductionOrg={Boolean(user && user.is_production_org)}
                preMessage={
                  plan.preflight_message ? (
                    // These messages are pre-cleaned by the API
                    <div
                      className="markdown"
                      dangerouslySetInnerHTML={{
                        __html: plan.preflight_message,
                      }}
                    />
                  ) : null
                }
                results={
                  preflight && user ? (
                    <PreflightResults preflight={preflight} />
                  ) : null
                }
                postMessage={this.getPostMessage()}
                cta={this.getCTA(selectedSteps)}
                backLink={
                  <BackLink
                    label={i18n.t('Select a different plan')}
                    url={routes.version_detail(product.slug, version.label)}
                    className="slds-p-top_small"
                  />
                }
              />
              <UserInfo user={user} />
              {plan.steps && plan.steps.length ? (
                <StepsTable
                  user={user}
                  plan={plan}
                  preflight={preflight}
                  steps={steps}
                  selectedSteps={selectedSteps}
                  handleStepsChange={this.handleStepsChange}
                />
              ) : null}
            </BodyContainer>
          ) : (
            <PlanNotAllowed
              isLoggedIn={user !== null}
              message={plan.not_allowed_instructions}
              link={
                <Trans i18nKey="planNotAllowed">
                  Try{' '}
                  <Link to={routes.version_detail(product.slug, version.label)}>
                    another plan
                  </Link>{' '}
                  from that product version
                </Trans>
              }
            />
          )}
        </>
      </DocumentTitle>
    );
  }
}

const select = (appState: AppState, props: InitialProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
  plan: selectPlan(appState, props),
  planSlug: selectPlanSlug(appState, props),
  preflight: selectPreflight(appState, props),
  org: selectOrg(appState),
});

const actions = {
  doFetchProduct: fetchProduct,
  doFetchVersion: fetchVersion,
  doFetchPlan: fetchPlan,
  doFetchPreflight: fetchPreflight,
  doStartPreflight: startPreflight,
  doStartJob: startJob,
};

const WrappedPlanDetail: React.ComponentType<InitialProps> = connect(
  select,
  actions,
)(PlanDetail);

export default WrappedPlanDetail;
