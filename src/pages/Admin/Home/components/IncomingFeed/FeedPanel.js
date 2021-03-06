/* eslint-disable no-return-assign, react/no-multi-comp */
import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'

import { useMutation } from '@apollo/react-hooks'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'

// Styles
import {
  Tabs,
  Tab,
  H3,
  H5,
  Icon,
  Button,
  Toaster,
  Position,
  HTMLSelect,
  ButtonGroup,
  TextArea,
} from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'

// Custom imports
import SafeURL from '@shared/components/SafeUrl'
import CaseInfoData from '@features/CaseInfo/components'
import { AuthConsumer } from '@shared/components/AuthContext/context'
import { PROCESS_SUBMISSION, INSERT_SUBMISSION_HISTORY } from '../../graphql/adminQueries'
import { PanelConsumer } from '../../../../../shared/components/Panel'

const FeedToaster = Toaster.create({
  classname: 'feed-toaster',
  position: Position.TOP_LEFT,
})

const ShareButton = ({ uuid }) => {
  const textAreaRef = useRef()

  const copySubmissionUrl = e => {
    textAreaRef.current.select()
    document.execCommand('copy')
    e.target.focus()

    FeedToaster.show({ message: 'Shareable link copied successfully!' })
  }

  return (
    <React.Fragment>
      <Button intent="primary" large fill icon={IconNames.CLIPBOARD} onClick={copySubmissionUrl}>
        Share
      </Button>

      <textarea
        ref={textAreaRef}
        readOnly
        value={`${window.location.protocol}//${window.location.hostname}/submission/${uuid}`}
        style={{ position: 'absolute', zIndex: '-1', height: 0, opacity: '0.01' }}
      />
    </React.Fragment>
  )
}

ShareButton.propTypes = {
  uuid: PropTypes.string.isRequired,
}

const SUBMISSION_DETAILS = gql`
  query submissionConfig {
    submission_configuration {
      uuid
      category
      points
    }
  }
`

const CategoryList = ({ currentCategory, handleChange }) => (
  <Query query={SUBMISSION_DETAILS} fetchPolicy="cache-first">
    {({ error, loading, data }) => {
      if (loading) return null
      if (error) return <div>{`${error.message}`}</div>

      return (
        <HTMLSelect name="category" value={currentCategory} onChange={handleChange} fill large>
          {data.submission_configuration.map(config => (
            <option
              key={config.uuid}
              id={config.category}
              value={config.uuid}
            >{`${config.category} (${config.points} pts.)`}</option>
          ))}
        </HTMLSelect>
      )
    }}
  </Query>
)

CategoryList.propTypes = {
  currentCategory: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
}

const AcceptSubmissionControls = ({ uuid, category, hidePanel }) => {
  const [acceptedReason, setAcceptedReason] = useState()

  // GraphQL Layer
  const [processSubmission] = useMutation(PROCESS_SUBMISSION)
  const [insertSubmissionHist] = useMutation(INSERT_SUBMISSION_HISTORY)

  // Handler Functions
  const handleChange = e => {
    setAcceptedReason(e.target.value)
  }

  return (
    <React.Fragment>
      <TextArea
        fill
        placeholder="(Optional) reason why the submission was accepted"
        value={acceptedReason}
        onChange={handleChange}
      />
      <AuthConsumer>
        {({ user }) => (
          <Button
            text="Accept"
            intent="success"
            large
            icon={IconNames.CROSS}
            style={{ marginTop: 10, marginBottom: 20 }}
            onClick={() => {
              processSubmission({
                variables: {
                  submissionID: uuid,
                  value: 'ACCEPTED',
                  processedAt: new Date(),
                  category,
                },
              })
                .then(() =>
                  insertSubmissionHist({
                    variables: {
                      submissionID: uuid,
                      decision: 'ACCEPTED',
                      processedBy: user.id,
                      acceptedReason,
                    },
                  }),
                )
                .then(hidePanel)
            }}
          />
        )}
      </AuthConsumer>
    </React.Fragment>
  )
}

/*
  @NOTE:
    This is a duplicate basically of the code above, but there are quite a few
    parameters that differ so right now I'm just duplicating
*/
const RejectSubmissionControls = ({ uuid, category, hidePanel }) => {
  const [rejectedReason, setRejectedReason] = useState()

  // GraphQL Layer
  const [processSubmission] = useMutation(PROCESS_SUBMISSION)
  const [insertSubmissionHist] = useMutation(INSERT_SUBMISSION_HISTORY)

  // Handler Functions
  const handleChange = e => {
    setRejectedReason(e.target.value)
  }

  return (
    <React.Fragment>
      <TextArea
        fill
        placeholder="Reason for rejecting the submission"
        value={rejectedReason}
        onChange={handleChange}
      />
      <AuthConsumer>
        {({ user }) => (
          <Button
            text="Reject"
            intent="danger"
            large
            disabled={!rejectedReason}
            icon={IconNames.CROSS}
            style={{ marginTop: 10, marginBottom: 20 }}
            onClick={() => {
              processSubmission({
                variables: {
                  submissionID: uuid,
                  value: 'REJECTED',
                  processedAt: new Date(),
                  category,
                },
              })
                .then(() =>
                  insertSubmissionHist({
                    variables: {
                      submissionID: uuid,
                      decision: 'REJECTED',
                      processedBy: user.id,
                      rejectedReason,
                    },
                  }),
                )
                .then(hidePanel)
            }}
          />
        )}
      </AuthConsumer>
    </React.Fragment>
  )
}

const SubmissionDetailsPanel = ({
  uuid,
  teamName,
  explanation,
  content,
  supportingEvidence,
  submission_files,
  hidePanel,
  category,
  handleChange,
}) => {
  // GraphQL Layer
  const [processSubmission] = useMutation(PROCESS_SUBMISSION)
  const [insertSubmissionHist] = useMutation(INSERT_SUBMISSION_HISTORY)

  return (
    <React.Fragment>
      <div>
        <CategoryList currentCategory={category} handleChange={handleChange} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          marginTop: 10,
          alignItems: 'center',
        }}
      >
        <ButtonGroup fill>
          <ShareButton uuid={uuid} />
          <AuthConsumer>
            {({ user }) => (
              <Button
                text="Star"
                intent="warning"
                large
                fill
                icon={IconNames.STAR}
                onClick={() => {
                  processSubmission({
                    variables: {
                      submissionID: uuid,
                      value: 'STARRED',
                      processedAt: new Date(),
                      category,
                    },
                  })
                    .then(() =>
                      insertSubmissionHist({
                        variables: {
                          submissionID: uuid,
                          decision: 'STARRED',
                          processedBy: user.id,
                        },
                      }),
                    )
                    .then(hidePanel)
                }}
              />
            )}
          </AuthConsumer>
        </ButtonGroup>
      </div>
      <div>
        <div style={{ background: '#E1E8ED', padding: 10, marginTop: 10, marginBottom: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <H3 style={{ borderBottom: '1px solid #c4cfd7', padding: 10 }}>{teamName}</H3>
          </div>
          <div style={{ paddingTop: 10 }}>
            <H5>Source URL</H5>
            <SafeURL dangerousURL={content} text={content} style={{ wordWrap: 'break-word' }} />
          </div>
          <div style={{ paddingTop: 10 }}>
            <H5>Relevance</H5>
            <p style={{ wordWrap: 'break-word' }}>{explanation}</p>
          </div>
          <div style={{ paddingTop: 10 }}>
            <H5>Supporting Evidence</H5>
            <p style={{ wordWrap: 'break-word' }}>{supportingEvidence}</p>
          </div>
          {submission_files.length > 0 && (
            <div style={{ paddingTop: 10 }}>
              <H5>Supporting Files</H5>
              {submission_files.map(function(file, i) {
                return (
                  <SafeURL
                    style={{ paddingRight: '5px' }}
                    key={i}
                    dangerousURL={file.url}
                    text={`File ${i + 1}`}
                  />
                )
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
          <AcceptSubmissionControls uuid={uuid} category={category} hidePanel={hidePanel} />
          <RejectSubmissionControls uuid={uuid} category={category} hidePanel={hidePanel} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
            <AuthConsumer>
              {({ user }) => (
                <Button
                  text="Non-Permitted Source"
                  intent="danger"
                  alignText="left"
                  large
                  fill
                  icon={IconNames.CROSS}
                  style={{ marginRight: 10 }}
                  onClick={() => {
                    processSubmission({
                      variables: {
                        submissionID: uuid,
                        value: 'REJECTED',
                        processedAt: new Date(),
                        category,
                      },
                    })
                      .then(() =>
                        insertSubmissionHist({
                          variables: {
                            submissionID: uuid,
                            decision: 'REJECTED',
                            processedBy: user.id,
                            rejectedReason:
                              'This submission originated from a non-permitted source such as: news, media, law enforcement, or speculative websites.  We do not accept these as they provide minimal intelligence value to law enforcement.',
                          },
                        }),
                      )
                      .then(hidePanel)
                  }}
                />
              )}
            </AuthConsumer>
            <AuthConsumer>
              {({ user }) => (
                <Button
                  text="Duplicate Submission"
                  intent="danger"
                  alignText="left"
                  large
                  fill
                  icon={IconNames.CROSS}
                  onClick={() => {
                    processSubmission({
                      variables: {
                        submissionID: uuid,
                        value: 'REJECTED',
                        processedAt: new Date(),
                        category,
                      },
                    })
                      .then(() =>
                        insertSubmissionHist({
                          variables: {
                            submissionID: uuid,
                            decision: 'REJECTED',
                            processedBy: user.id,
                            rejectedReason:
                              'You or one of your team members has already submitted this intelligence.',
                          },
                        }),
                      )
                      .then(hidePanel)
                  }}
                />
              )}
            </AuthConsumer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
            <AuthConsumer>
              {({ user }) => (
                <Button
                  text="Additional Context Required"
                  intent="danger"
                  alignText="left"
                  large
                  fill
                  icon={IconNames.CROSS}
                  style={{ marginRight: 10 }}
                  onClick={() => {
                    processSubmission({
                      variables: {
                        submissionID: uuid,
                        value: 'REJECTED',
                        processedAt: new Date(),
                        category,
                      },
                    })
                      .then(() =>
                        insertSubmissionHist({
                          variables: {
                            submissionID: uuid,
                            decision: 'REJECTED',
                            processedBy: user.id,
                            rejectedReason:
                              'To award points for this submission, we require additional context or support this intelligence',
                          },
                        }),
                      )
                      .then(hidePanel)
                  }}
                />
              )}
            </AuthConsumer>
            <AuthConsumer>
              {({ user }) => (
                <Button
                  text="Not Relevant"
                  intent="danger"
                  alignText="left"
                  large
                  fill
                  icon={IconNames.CROSS}
                  onClick={() => {
                    processSubmission({
                      variables: {
                        submissionID: uuid,
                        value: 'REJECTED',
                        processedAt: new Date(),
                        category,
                      },
                    })
                      .then(() =>
                        insertSubmissionHist({
                          variables: {
                            submissionID: uuid,
                            decision: 'REJECTED',
                            processedBy: user.id,
                            rejectedReason:
                              'This submission has been determined as not relevant to the case.',
                          },
                        }),
                      )
                      .then(hidePanel)
                  }}
                />
              )}
            </AuthConsumer>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

const PanelContent = ({
  uuid,
  caseID,
  teamName,
  explanation,
  content,
  supportingEvidence,
  submission_files,
  hidePanel,
  submissionConfiguration,
}) => {
  const [category, setCategory] = useState(submissionConfiguration.uuid)

  const handleChange = e => {
    setCategory(e.currentTarget.value)
  }

  return (
    <React.Fragment>
      <Tabs id="detailsTab" selectedTabIndex="submissionDetails" renderActiveTabPanelOnly>
        <Tab
          id="submissionDetails"
          title="Submission Details"
          panel={
            <SubmissionDetailsPanel
              uuid={uuid}
              teamName={teamName}
              explanation={explanation}
              content={content}
              supportingEvidence={supportingEvidence}
              submission_files={submission_files}
              hidePanel={hidePanel}
              category={category}
              handleChange={handleChange}
            />
          }
        />
        <Tab id="caseDetails" title="Case Details" panel={<CaseInfoData caseID={caseID} />} />
      </Tabs>
    </React.Fragment>
  )
}

PanelContent.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  submissionConfiguration: PropTypes.any.isRequired,
  uuid: PropTypes.string.isRequired,
  teamName: PropTypes.string.isRequired,
  explanation: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  hidePanel: PropTypes.func.isRequired,
  caseID: PropTypes.string.isRequired,
}

const FeedPanel = ({
  uuid,
  teamByteamId,
  explanation,
  content,
  supporting_evidence,
  submission_files,
  submissionConfigurationByconfigId,
  case: { uuid: caseID },
}) => (
  <PanelConsumer>
    {({ hidePanel }) => (
      <div
        style={{
          position: 'absolute',
          width: '500px',
          right: '365px',
          background: '#F5F8FA',
          top: 0,
          height: '100%',
          padding: 20,
          zIndex: 9999,
          borderRight: '1px solid #e6dddd',
          boxShadow: '-10px 0px 10px 1px rgba(0, 0, 0,0.08)',
          overflowY: 'auto',
        }}
      >
        <Icon icon={IconNames.CROSS} iconSize={32} onClick={hidePanel} />
        <PanelContent
          uuid={uuid}
          teamName={teamByteamId.name}
          explanation={explanation}
          content={content}
          supportingEvidence={supporting_evidence}
          submission_files={submission_files}
          submissionConfiguration={submissionConfigurationByconfigId}
          hidePanel={hidePanel}
          caseID={caseID}
          key={uuid}
        />
      </div>
    )}
  </PanelConsumer>
)

FeedPanel.propTypes = {
  uuid: PropTypes.string.isRequired,
  teamByteamId: PropTypes.objectOf(PropTypes.object).isRequired,
  explanation: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  submissionConfigurationByconfigId: PropTypes.any.isRequired,
}

export default FeedPanel
