export default {
  headerShow: 'Quality of Service requirements',
  headerAdd: 'Add Quality of Service requirement',
  headerAddMobile: 'Add QoS requirement',
  addHintTitle: 'Adding QoS requirement',
  addHint: 'QoS requirement is used to specify a desired number of replicas for the subject file/directory and an expression used to select matching storage backends where the replicas will be placed. The replicas will be automatically managed ‐ protected from eviction and reconciled upon changes to the file content.',
  showHintTitle: 'QoS requirements',
  showHintIntro: 'QoS is used to manage file replica distribution and redundancy between supporting Oneproviders. Users can define any number of QoS requirements for a file or directory. Each requirement consists of target replicas number and an expression that is used to select storage backends where the replicas should be placed – it is matched against parameters that were assigned to storage backends by Oneprovider admins.',
  showHintTransfers: 'If required, data transfers are automatically triggered to satisfy the QoS requirements, and remote changes made to file content are automatically reconciled. File replicas corresponding to QoS requirements are protected from eviction.',
  showHintRemoving: 'Removing a QoS requirement does not automatically remove the replicas that were created during its lifetime, but they are no longer protected.',
  showHintDocLinkName: 'QoS',
  hintClose: 'OK',
};
