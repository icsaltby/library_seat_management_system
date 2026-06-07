from datetime import time

from model import OpenTimeConfig, db


def find_open_time_config():
    config = OpenTimeConfig.query.order_by(OpenTimeConfig.id.asc()).first()
    if config:
        return config

    config = OpenTimeConfig(
        open_time=time(hour=8, minute=0),
        close_time=time(hour=22, minute=0),
        reserve_start_time=time(hour=7, minute=30),
        reserve_end_time=time(hour=21, minute=30),
        sign_limit=15,
        leave_limit=15,
    )
    db.session.add(config)
    db.session.commit()
    return config
