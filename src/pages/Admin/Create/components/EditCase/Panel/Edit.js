/* eslint-disable no-shadow */
import React from 'react'
import PropTypes from 'prop-types'
import { Query, Mutation } from 'react-apollo'
import { Formik } from 'formik'

import { adopt } from 'react-adopt'

// Styles
import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'

// Custom Components
import { SlidingPanelConsumer, SlidingPane } from '../../../../../../shared/components/SlidingPane'
import {
  EDIT_EVENT_CASE_MUTATION,
  EDIT_CASE_MUTATION,
  CASES_QUERY,
  CASE_QUERY,
} from '../../../graphql/graphQueries'

import EditCaseForm from './Form'

// eslint-disable-next-line react/prop-types
const updateEventCase = ({ render }) => (
  <Mutation mutation={EDIT_EVENT_CASE_MUTATION} refetchQueries={[{ query: CASES_QUERY }]}>
    {(mutation, result) => render({ mutation, result })}
  </Mutation>
)

// eslint-disable-next-line react/prop-types
const updateCase = ({ render }) => (
  <Mutation mutation={EDIT_CASE_MUTATION} refetchQueries={[{ query: CASES_QUERY }]}>
    {(mutation, result) => render({ mutation, result })}
  </Mutation>
)

const ComposedMutations = adopt({
  updateEventCase,
  updateCase,
})

const EditCase = ({ isOpen, onRequestClose, ...otherProps }) => (
  <SlidingPane
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    closeIcon={<Icon icon={IconNames.MENU_CLOSED} iconSize={20} />}
  >
    <SlidingPane.Header>
      <SlidingPane.Header.Title title="Edit a Case" subtitle="Fill out the form and save" />
      <SlidingPane.Header.Actions onActionClick={onRequestClose}>
        <a>Cancel</a>
      </SlidingPane.Header.Actions>
    </SlidingPane.Header>

    <SlidingPane.Content>
      <SlidingPanelConsumer>
        {({ closeSlider }) => (
          <Query
            query={CASE_QUERY}
            variables={{ caseID: otherProps.caseID }}
            skip={!otherProps.caseID}
          >
            {({ data, loading, error }) => {
              if (!data) return null
              if (loading) return null
              if (error) return <div>{error.message}</div>

              const { event_id: eventId, ...rest } = data.eventCase[0]

              return (
                <ComposedMutations>
                  {({ updateCase, updateEventCase }) => {
                    const saveCase = async values => {
                      const { eventID, ..._case } = values
                      await updateEventCase.mutation({
                        variables: { eventID, caseID: otherProps.caseID },
                      })
                      await updateCase.mutation({
                        variables: { caseID: otherProps.caseID, input: { ..._case } },
                      })
                    }

                    return (
                      <Formik
                        initialValues={{
                          eventID: eventId,
                          name: rest.case.name,
                          missing_since: rest.case.missing_since,
                          missing_from: rest.case.missing_from,
                          source_url: rest.case.source_url,
                          age: rest.case.age,
                          height: rest.case.height,
                          weight: rest.case.weight,
                          characteristics: rest.case.characteristics,
                          disappearance_details: rest.case.disappearance_details,
                          other_notes: rest.case.other_notes,
                        }}
                        onSubmit={values => saveCase(values).then(() => closeSlider())}
                        render={formikProps => <EditCaseForm {...formikProps} />}
                      />
                    )
                  }}
                </ComposedMutations>
              )
            }}
          </Query>
        )}
      </SlidingPanelConsumer>
    </SlidingPane.Content>

    <SlidingPane.Actions form="editCaseForm">SAVE</SlidingPane.Actions>
  </SlidingPane>
)

EditCase.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
}

export default EditCase
