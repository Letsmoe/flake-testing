from .snap import snap
from .afterEach import afterEach
from .beforeEach import beforeEach
from ._assert import _
from .every import every
from .group import group
from .capture import capture

from .publish import publish
import atexit

atexit.register(publish)

del publish
del atexit