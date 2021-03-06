/* eslint-disable import/prefer-default-export */
import gql from 'graphql-tag'

const GET_SUBMISSION_QUERY = gql`
  query getSubmission($submissionID: uuid!) {
    submission(where: { uuid: { _eq: $submissionID } }) {
      teamByteamId {
        name
      }
      case {
        name
      }
      submissionConfigurationByconfigId {
        category
      }
      content
      explanation
    }
  }
`

export { GET_SUBMISSION_QUERY }
