
export const getScoreStatus = (score: number) => {
  if (score >= 80) {
    return {
      status: 'Excellent',
      color: 'text-status-success',
      bg: 'bg-status-success',
      borderColor: 'border-status-success'
    };
  } else if (score >= 60) {
    return {
      status: 'Good',
      color: 'text-electric-blue',
      bg: 'bg-electric-blue',
      borderColor: 'border-electric-blue'
    };
  } else if (score >= 40) {
    return {
      status: 'Fair',
      color: 'text-status-warning',
      bg: 'bg-status-warning',
      borderColor: 'border-status-warning'
    };
  } else {
    return {
      status: 'Poor',
      color: 'text-status-error',
      bg: 'bg-status-error',
      borderColor: 'border-status-error'
    };
  }
};

