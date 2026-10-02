import { Router, Request, Response, NextFunction } from 'express';
import { timelineService } from './timeline.service';
import { authenticate } from '../../middleware/authenticate';

export const timelineRouter = Router({ mergeParams: true });

timelineRouter.use(authenticate);

timelineRouter.get('/:id/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await timelineService.getTimelineForApplication(req.user!.id, req.params.id);
    return res.status(200).json({ data: events });
  } catch (error) {
    return next(error);
  }
});

timelineRouter.post('/:id/timeline/note', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { note } = req.body;
    if (!note || typeof note !== 'string') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Note text is required' } });
    }
    const event = await timelineService.addNote(req.user!.id, req.params.id, note.trim());
    return res.status(201).json({ data: event });
  } catch (error) {
    return next(error);
  }
});
