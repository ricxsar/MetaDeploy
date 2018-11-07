// @flow

import * as React from 'react';
import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';

import { CONSTANTS } from 'plans/reducer';

import { ErrorsList } from 'components/plans/preflightResults';

import type {
  Plan as PlanType,
  Step as StepType,
  Preflight as PreflightType,
} from 'plans/reducer';
import type { SelectedSteps as SelectedStepsType } from 'components/plans/detail';
import type { User as UserType } from 'accounts/reducer';

type DataCellProps = {
  [string]: mixed,
  user?: UserType,
  preflight?: ?PreflightType,
  item?: {| ...StepType, +id: string |},
  className?: string,
  selectedSteps?: SelectedStepsType,
  handleStepsChange?: (number, boolean) => void,
};

const { RESULT_STATUS } = CONSTANTS;

class NameDataCell extends React.Component<
  DataCellProps,
  { expanded: boolean },
> {
  constructor(props: DataCellProps) {
    super(props);
    this.state = { expanded: false };
  }

  render(): React.Node {
    const { preflight, item, className, ...otherProps } = this.props;
    /* istanbul ignore if */
    if (!item) {
      return null;
    }
    const { name, description } = item;
    const { id } = item;
    const result = preflight && preflight.results && preflight.results[id];
    let hasError = false;
    let hasWarning = false;
    let optional;
    let optionalMsg = '';
    if (result) {
      hasError =
        result.find(err => err.status === RESULT_STATUS.ERROR) !== undefined;
      hasWarning =
        result.find(err => err.status === RESULT_STATUS.WARN) !== undefined;
      optional = result.find(res => res.status === RESULT_STATUS.OPTIONAL);
      optionalMsg = optional && optional.message;
    }
    let display = name;
    if (optionalMsg) {
      display = `${name} — ${optionalMsg}`;
    }
    const classes = classNames(className, {
      'has-warning': hasWarning,
      'has-error': hasError,
    });
    const errorList =
      result && (hasError || hasWarning) ? (
        <ErrorsList errorList={result} />
      ) : null;
    return (
      <DataTableCell title={name} className={classes} {...otherProps}>
        {description ? (
          <>
            <Accordion className="slds-cell-wrap">
              <AccordionPanel
                id={id}
                title={name}
                summary={<p className="slds-cell-wrap">{display}</p>}
                expanded={this.state.expanded}
                onTogglePanel={() => {
                  this.setState({ expanded: !this.state.expanded });
                }}
              >
                {description}
              </AccordionPanel>
            </Accordion>
            {errorList ? (
              <div
                className="step-name-no-icon
                  slds-p-bottom_small
                  slds-cell-wrap"
              >
                {errorList}
              </div>
            ) : null}
          </>
        ) : (
          <div
            className="step-name-no-icon
              slds-p-vertical_small
              slds-cell-wrap"
          >
            <p className={errorList ? 'slds-p-bottom_small' : ''}>{display}</p>
            {errorList}
          </div>
        )}
      </DataTableCell>
    );
  }
}
NameDataCell.displayName = DataTableCell.displayName;

const KindDataCell = (props: DataCellProps): React.Node => {
  /* istanbul ignore if */
  if (!props.item) {
    return null;
  }
  const value = props.item.kind;
  const iconName = props.item.kind_icon;
  return (
    <DataTableCell title={value} {...props}>
      {iconName ? (
        <Icon
          className="slds-m-right_x-small"
          category="utility"
          name={iconName}
          assistiveText={{
            label: value,
          }}
          size="x-small"
        />
      ) : null}
      <span>{value}</span>
    </DataTableCell>
  );
};
KindDataCell.displayName = DataTableCell.displayName;

const RequiredDataCell = (props: DataCellProps): React.Node => {
  const { preflight, item } = props;
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const { id } = item;
  const result = preflight && preflight.results && preflight.results[id];
  let skipped, optional;
  if (result) {
    skipped = result.find(res => res.status === RESULT_STATUS.SKIP);
    optional = result.find(res => res.status === RESULT_STATUS.OPTIONAL);
  }
  const required = item.is_required && !optional;
  const classes = classNames(
    'slds-align-middle',
    'slds-badge',
    'slds-m-horizontal_large',
    { 'slds-badge_inverse': !required },
  );
  let text = 'Optional';
  if (skipped) {
    text = 'Skipped';
  } else if (required) {
    text = 'Required';
  }
  return (
    <DataTableCell title={text} {...props}>
      <span className={classes}>{text}</span>
    </DataTableCell>
  );
};
RequiredDataCell.displayName = DataTableCell.displayName;

const InstallDataCell = (props: DataCellProps): React.Node => {
  const { preflight, item, selectedSteps, handleStepsChange } = props;
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const hasValidToken = props.user && props.user.valid_token_for !== null;
  const hasReadyPreflight = preflight && preflight.is_ready;
  const { id } = item;
  const idInt = parseInt(id, 10);
  const result = preflight && preflight.results && preflight.results[id];
  let skipped, optional;
  if (result) {
    skipped = result.find(res => res.status === RESULT_STATUS.SKIP);
    optional = result.find(res => res.status === RESULT_STATUS.OPTIONAL);
  }
  const required = item.is_required && !optional;
  const recommended = !required && item.is_recommended;
  const disabled =
    Boolean(skipped) || required || !hasValidToken || !hasReadyPreflight;
  let label = '';
  if (skipped && skipped.message) {
    label = skipped.message;
  } else if (recommended) {
    label = 'recommended';
  }
  return (
    <DataTableCell {...props}>
      <Checkbox
        id={`step-${id}`}
        checked={selectedSteps && selectedSteps.has(idInt)}
        disabled={disabled}
        className="slds-p-vertical_x-small"
        labels={{ label }}
        onChange={(
          event: SyntheticInputEvent<HTMLInputElement>,
          { checked }: { checked: boolean },
        ) => {
          /* istanbul ignore else */
          if (handleStepsChange) {
            handleStepsChange(idInt, checked);
          }
        }}
      />
    </DataTableCell>
  );
};
InstallDataCell.displayName = DataTableCell.displayName;

const InstallDataColumnLabel = (): React.Node => (
  <>
    <span title="Install">Install</span>
    <Tooltip
      align="top right"
      content={
        <span className="step-column-tooltip">Select steps to install.</span>
      }
      triggerClassName="slds-p-left_x-small"
      position="overflowBoundaryElement"
    >
      {/* @@@ This should not be necessary...
          https://github.com/salesforce/design-system-react/issues/1578 */}
      <a>
        <Icon
          category="utility"
          name="info"
          assistiveText={{
            label: 'Learn More',
          }}
          size="xx-small"
        />
      </a>
    </Tooltip>
  </>
);

const StepsTable = ({
  user,
  plan,
  preflight,
  selectedSteps,
  handleStepsChange,
}: {
  user: UserType,
  plan: PlanType,
  preflight: ?PreflightType,
  selectedSteps: SelectedStepsType,
  handleStepsChange: (number, boolean) => void,
}) => (
  // DataTable uses step IDs internally to construct unique keys,
  // and they must be strings (not integers)
  <article className="slds-card slds-scrollable_x">
    <DataTable
      items={plan.steps.map(step => ({
        ...step,
        id: step.id.toString(),
      }))}
      id="plan-steps-table"
    >
      <DataTableColumn key="name" label="Steps" property="name" primaryColumn>
        <NameDataCell preflight={preflight} />
      </DataTableColumn>
      <DataTableColumn key="kind" label="Type" property="kind">
        <KindDataCell />
      </DataTableColumn>
      <DataTableColumn key="is_required" property="is_required">
        <RequiredDataCell preflight={preflight} />
      </DataTableColumn>
      <DataTableColumn
        key="is_recommended"
        label={<InstallDataColumnLabel />}
        property="is_recommended"
      >
        <InstallDataCell
          user={user}
          preflight={preflight}
          selectedSteps={selectedSteps}
          handleStepsChange={handleStepsChange}
        />
      </DataTableColumn>
    </DataTable>
  </article>
);

export default StepsTable;
