import React, { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import Dropdown from '@/components/common/Dropdown';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import { actionItemsService, ActionItem } from '@/lib/api/services/actionitems';
import { userService, User } from '@/lib/api';
import { showToast } from '@/lib/utils/toast';

interface ReassignActionItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToDelete: User | null;
  allUsers: User[];
  onDeleted: () => void;
}

const ReassignActionItemsModal: React.FC<ReassignActionItemsModalProps> = ({
  isOpen,
  onClose,
  userToDelete,
  allUsers,
  onDeleted,
}) => {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && userToDelete) {
      setAssignments({});
      setLoading(true);
      actionItemsService
        .getActionItemsAssignedToUser(userToDelete._id)
        .then((response) => {
          if (response.data?.success && response.data?.data) {
            setItems(response.data.data);
          } else {
            setItems([]);
            showToast.error(response.error || 'Failed to load assigned action items');
          }
        })
        .catch(() => {
          setItems([]);
          showToast.error('Failed to load assigned action items');
        })
        .finally(() => setLoading(false));
    } else if (!isOpen) {
      setItems([]);
      setAssignments({});
    }
  }, [isOpen, userToDelete]);

  const deletingUserId = userToDelete?._id || userToDelete?.id;
  const userOptions = allUsers
    .filter((u) => (u._id || u.id) !== deletingUserId)
    .map((u) => ({ value: u._id || u.id, label: `${u.name} (${u.email})` }));

  const allAssigned = items.length > 0 && items.every((item) => assignments[item._id]);

  const handleReassignAndDelete = async () => {
    if (!userToDelete || !allAssigned) return;
    setSubmitting(true);
    try {
      for (const item of items) {
        const newAssignee = assignments[item._id];
        const response = await actionItemsService.updateActionItem(item._id, {
          assignTo: newAssignee,
          assignToModel: 'User',
        });
        if (!response.success) {
          showToast.error(response.error || `Failed to reassign "${item.title}"`);
          setSubmitting(false);
          return;
        }
      }

      const deleteResponse = await userService.deleteUser(userToDelete._id);
      if (!deleteResponse.success) {
        showToast.error(deleteResponse.error || 'Action items reassigned, but failed to delete the user');
        setSubmitting(false);
        return;
      }

      showToast.success('Action items reassigned and user deleted successfully');
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error reassigning action items / deleting user:', error);
      showToast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reassign Action Items" size="lg" showCloseButton>
      <p className="text-gray-600 mb-4 text-sm">
        <span className="font-semibold">{userToDelete?.name}</span> is the sole assignee on {items.length} action
        item{items.length === 1 ? '' : 's'}. Reassign {items.length === 1 ? 'it' : 'each of them'} to someone else,
        and the user will be deleted right after.
      </p>
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader size="md" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No blocking action items found. You can try deleting the user again.</p>
      ) : (
        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item._id} className="border border-gray-200 rounded-lg p-3">
              <div className="font-medium text-gray-900 mb-2">{item.title}</div>
              <Dropdown
                label="Reassign to"
                options={[{ value: '', label: 'Select a new assignee' }, ...userOptions]}
                value={assignments[item._id] || ''}
                onChange={(value) => setAssignments((prev) => ({ ...prev, [item._id]: value }))}
                fullWidth
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        {items.length > 0 && (
          <Button variant="primary" onClick={handleReassignAndDelete} disabled={submitting || loading || !allAssigned}>
            {submitting ? 'Reassigning...' : 'Reassign & Delete User'}
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ReassignActionItemsModal;
