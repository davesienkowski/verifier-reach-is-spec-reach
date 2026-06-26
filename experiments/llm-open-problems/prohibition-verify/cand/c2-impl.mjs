export const deleteButtonStyle = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  padding: 12,
  borderRadius: 8,
};

export function DeleteButton() {
  return { role: 'button', label: 'Delete', style: deleteButtonStyle };
}
